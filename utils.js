const https = require('https')

function stringToHeaders(data) {
    let ret = {}
    const r = /.+?:.+?$/gm

    data.match(r).map(x => {
        const s = x.split(': ')
        ret[s[0]] = s[1];
    })

    return ret
}

function getHeaderValue(headers, cookie, value) {
    const r = new RegExp(value+'=(.+?);','igm');
    for (let i = 0; i < headers[cookie].length; i++) {
        m = r.exec(headers[cookie][i])
        if (m && m.length > 1)
            return m[1]
    }
    return null;
}

async function async_https_get(url, headers) {
    return new Promise((resolve, reject) => {
        let body = '';
        https.get(url, {headers: headers}, res => {
            res.on('data', chunk => { body += chunk.toString() })
            res.on('end', () => {
                resolve([body, res.headers])
            })
        }).on('error', (e) => {
            reject(e)
        })
    })
}

module.exports = {
    stringToHeaders,
    getHeaderValue,
    async_https_get
}