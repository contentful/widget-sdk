'use strict';

const { URL } = require('url');

const ALLOWED_API_HOSTNAMES = [
  'api.contentful.com',
  'api.flinkly.com',
  'api.quirely.com',
  'api.joistio.com'
];

const make401 = () => {
  const err = new Error('Authorization required.');
  err.status = 401;
  return err;
};

module.exports = async (libs, spaceId, token, api = 'https://api.contentful.com') => {
  api = api.replace(/\/+$/, '');

  console.log(`Fetching membership for space ID ${spaceId} from ${api}.`);

  const { hostname } = new URL(api);
  if (!ALLOWED_API_HOSTNAMES.includes(hostname)) {
    console.error(`${hostname} is not a valid CMA hostname.`);
    throw make401();
  }

  const res = await libs.fetch(`${api}/token`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status !== 200) {
    throw make401();
  }

  const _ = libs.lodash;
  const memberships = _.get(await res.json(), ['includes', 'SpaceMembership'], []);
  const membership = memberships.find(m => _.get(m, ['sys', 'space', 'sys', 'id']) === spaceId);

  if (membership) {
    console.log(`Membership found, ID: ${membership.sys.id}.`);
    console.log(membership.admin ? 'Is admin.' : 'Is not admin.');
    return membership;
  } else {
    console.log('Membership not found.');
    throw make401();
  }
};
