'use strict';

const { URL } = require('url');

const ALLOWED_API_HOSTNAMES = [
  'api.contentful.com',
  'api.flinkly.com',
  'api.quirely.com',
  'api.joistio.com'
];

module.exports = async (libs, orgId, token, api = 'https://api.contentful.com') => {
  api = api.replace(/\/+$/, '');

  const { hostname } = new URL(api);
  if (!ALLOWED_API_HOSTNAMES.includes(hostname)) {
    console.error(`${hostname} is not a valid CMA hostname.`);
    throw Error();
  }

  const res = await libs.fetch(`${api}/token`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status !== 200) {
    throw Error();
  }

  const _ = libs.lodash;
  const tokenContent = await res.json();
  const memberships = _.get(tokenContent, ['includes', 'OrganizationMembership'], []);
  const membership = _.find(memberships, { organization: { sys: { id: orgId } } });

  if (membership && (membership.role === 'admin' || membership.role === 'owner')) {
    console.log(`Membership found and authorized, ID: ${membership.sys.id}.`);
    return membership;
  } else {
    console.log('Membership not found or not authorized.');
    throw Error();
  }
};
