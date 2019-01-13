'use strict';

const querystring = require('querystring');

// There's only one target e-mail address now.
// We use a sandbox with only this e-mail in it.
const DOMAIN = 'sandbox4c2481fd73904fc983d4526ea869f597.mailgun.org';
const API_KEY = '85be5437fb63d71aec4a8f99eff1022d-6b60e603-8a27e1dd';

const TARGET_MAILS = {
  extensibility: 'team-extensibility+apps@contentful.com',
  bizVel: 'squad-hejo@contentful.com'
};

const getMailText = ({ feeback, userId, organizationId, teamId, agreed = false }) =>
  `
  ${feeback || 'No feedback provided'}${agreed &&
    `
    <br />
    <br />
    User agreed to be contacted.
    user: https://admin.contentful.com/admin/users/${userId}
    organization: https://admin.contentful.com/admin/organizations/${organizationId}
    team: https://admin.contentful.com/admin/teams/${teamId}
  `}
`;

module.exports = {
  apiVersion: 1,
  dependencies: ['fetch'],
  handle: async ({ req, kv, dependencies }) => {
    if (req.path !== '/' || req.method !== 'POST' || typeof req.body !== 'object') {
      return { statusCode: 404 };
    }

    const url = `https://api.mailgun.net/v3/${DOMAIN}/messages`;
    const basicAuth = Buffer.from(`api:${API_KEY}`).toString('base64');

    const params = {
      from: `feedback@${DOMAIN}`,
      to: TARGET_MAILS[req.body.target],
      subject: `[Feedback] ${req.body.about || 'Apps'}`,
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

    try {
      const random = require('crypto')
        .randomBytes(4)
        .toString('hex');
      await kv.set(`feedback-${Date.now()}-${random}`, req.body);
    } catch (err) {
      console.log('Failed to backup feedback to KV.');
    }

    return { statusCode: res.ok ? 200 : 500 };
  }
};
