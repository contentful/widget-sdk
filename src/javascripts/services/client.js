import _ from 'lodash';
import LegacyClient from 'libs/legacy_client/client';
import { apiUrl } from 'Config';
import * as Auth from 'Authentication';
import makeRequest from 'data/Request';

const defaultHeaders = {
  'X-Contentful-Skip-Transformation': true,
  'Content-Type': 'application/vnd.contentful.management.v1+json'
};

async function request(req) {
  req = await buildRequest(req);

  const baseRequest = makeRequest(Auth);

  try {
    const response = await baseRequest(req);
    return response.data;
  } catch (e) {
    return Promise.reject({
      // We duplicate this property because `statusCode` is used througout the code base
      statusCode: parseInt(e.status, 10),
      status: e.status,
      body: e.data,
      request: req
    });
  }
}

async function buildRequest(data) {
  const baseUrl = apiUrl().slice(0, -1); // Remove trailing slash

  const req = {
    method: data.method,
    url: [baseUrl, data.path.replace(/^\/+/, '')].join('/'),
    headers: _.extend({}, defaultHeaders, data.headers)
  };

  const payloadProperty = data.method === 'GET' ? 'params' : 'data';
  req[payloadProperty] = data.payload;

  return req;
}

function createSpace(payload, organizationId) {
  return request({
    method: 'POST',
    path: '/spaces',
    payload,
    headers: { 'X-Contentful-Organization': organizationId }
  });
}

const legacyClient = new LegacyClient({ request: request });

export default _.extend(legacyClient, {
  request,
  createSpace
});
