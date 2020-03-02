'use strict';

const querystring = require('querystring');

// These are credentials for a sandbox w/ only target emails configured.
const DOMAIN = 'sandbox4c2481fd73904fc983d4526ea869f597.mailgun.org';
const API_KEY = '85be5437fb63d71aec4a8f99eff1022d-6b60e603-8a27e1dd';

const TARGET_MAILS = {
  extensibility: 'team-extensibility+apps@contentful.com',
  devWorkflows: 'prd-dev-workflows+aliases-feedback@contentful.com',
  cxPulitzerReleases: 'team-pulitzer+feedback-releases@contentful.com'
};

const getMailText = ({ feedback, userId, orgId }) => `
${feedback || 'No feedback provided.'}



${userId ? 'User agreed to be contacted' : 'User wants to stay anonymous'}.

${userId ? `User: https://admin.contentful.com/admin/users/${userId}` : ''}
${orgId ? `Org: https://admin.contentful.com/admin/organizations/${orgId}` : ''}
`;

module.exports = {
  apiVersion: 1,
  memorySize: 256,
  timeout: 5,
  dependencies: ['fetch'],
  handle: async ({ req, dependencies }) => {
    if (req.path !== '/' || req.method !== 'POST' || typeof req.body !== 'object') {
      return { statusCode: 404 };
    }

    const url = `https://api.mailgun.net/v3/${DOMAIN}/messages`;
    const basicAuth = Buffer.from(`api:${API_KEY}`).toString('base64');

    const params = {
      from: `feedback@${DOMAIN}`,
      to: TARGET_MAILS[req.body.target],
      subject: `[Feedback] ${req.body.about || 'Unknown feature'}`,
      text: getMailText(req.body)
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
