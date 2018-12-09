'use strict';

const querystring = require('querystring');

const DOMAIN = 'sandbox4c2481fd73904fc983d4526ea869f597.mailgun.org';
const API_KEY = '85be5437fb63d71aec4a8f99eff1022d-6b60e603-8a27e1dd';
const TARGET_MAIL = 'jakub@contentful.com';

module.exports = {
  apiVersion: 1,
  dependencies: ['fetch'],
  handle: async ({ req, dependencies }) => {
    if (req.path !== '/' || req.method !== 'POST') {
      return { statusCode: 404 };
    }

    const url = `https://api.mailgun.net/v3/${DOMAIN}/messages`;
    const basicAuth = Buffer.from(`api:${API_KEY}`).toString('base64');
    const params = {
      from: `feedback@${DOMAIN}`,
      to: TARGET_MAIL,
      subject: 'Feedback about Apps',
      text: 'some text, hello world'
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
