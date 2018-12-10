'use strict';

const querystring = require('querystring');

// There's only one target e-mail address now.
// We use a sandbox with only this e-mail in it.
const DOMAIN = 'sandbox4c2481fd73904fc983d4526ea869f597.mailgun.org';
const API_KEY = '85be5437fb63d71aec4a8f99eff1022d-6b60e603-8a27e1dd';
const TARGET_MAIL = 'team-extensibility+apps@contentful.com';

module.exports = {
  apiVersion: 1,
  dependencies: ['fetch'],
  handle: async ({ req, dependencies }) => {
    if (req.path !== '/' || req.method !== 'POST' || typeof req.body !== 'object') {
      return { statusCode: 404 };
    }

    const url = `https://api.mailgun.net/v3/${DOMAIN}/messages`;
    const basicAuth = Buffer.from(`api:${API_KEY}`).toString('base64');

    const params = {
      from: `feedback@${DOMAIN}`,
      to: TARGET_MAIL,
      subject: 'Feedback about Apps',
      text: Object.keys(req.body)
        .map(key => `${key}: ${req.body[key]}`)
        .join('\n\n')
    };

    const res = await dependencies.fetch(url, {
      method: 'POST',
      body: querystring.stringify(params),
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return { statusCode: res.ok ? 200 : 500 };
  }
};
