'use strict';

const querystring = require('querystring');

// There's only one target e-mail address now.
// We use a sandbox with only this e-mail in it.
const DOMAIN = 'sandbox4c2481fd73904fc983d4526ea869f597.mailgun.org';
const API_KEY = '85be5437fb63d71aec4a8f99eff1022d-6b60e603-8a27e1dd';

const TARGET_MAILS = {
  extensibility: 'team-extensibility+apps@contentful.com',
  bizVel: 'squad-hejo+feedback@contentful.com',
  // TODO: Please change this to one of the authoring group's
  // product team email.
  authoring: 'mohamed+feedback@contentful.com'
};

const getOrgLink = ({ organizationId }) =>
  organizationId
    ? `organization: https://admin.contentful.com/admin/organizations/${organizationId}`
    : '';

const getTeamLink = ({ teamId }) =>
  teamId ? `team: https://admin.contentful.com/admin/teams/${teamId}` : '';

const getMailText = params => `
  ${params.feedback || 'No feedback provided'}



  ${
    params.canBeContacted
      ? `
      User agreed to be contacted.
      user: https://admin.contentful.com/admin/users/${params.userId}
      ${getOrgLink(params)}
      ${getTeamLink(params)}
    `
      : 'User wants to stay anonymous'
  }
`;

module.exports = {
  apiVersion: 1,
  memorySize: 256,
  timeout: 5,
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
