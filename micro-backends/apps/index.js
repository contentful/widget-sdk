'use strict';

const { respond, respond404, respond422 } = require('./responses.js');
const getSpaceMembership = require('./space-membership.js');

module.exports = {
  apiVersion: 1,
  dependencies: ['lodash', 'fetch'],
  handle: async ({ req, kv, dependencies }) => {
    const { path, method, body, headers } = req;

    // URLs are: `/apps/spaces/:spaceId/:appId`.
    // `/apps/` is the backend name and is not included in `path`.
    const [spacesSegment, spaceId, appId] = path
      .split('/')
      .filter(s => typeof s === 'string' && s.length > 0);

    // "/spaces/:spaceId" component is required.
    if (spacesSegment !== 'spaces' || !spaceId) {
      return respond404();
    }

    // Fetch a space membership.
    // If there's no membership for token/space ID pair - respond with 401.
    let membership = null;
    try {
      const token = headers['x-contentful-token'];
      const api = headers['x-contentful-api'];
      membership = await getSpaceMembership(dependencies, spaceId, token, api);
    } catch (err) {
      return respond({ message: err.message }, err.status || 500);
    }

    // Get apps for a space from KV.
    const apps = (await kv.get(spaceId)) || {};

    // GET /apps/spaces/:spaceId
    if (method === 'GET' && !appId) {
      return respond(apps);
    }

    // Only admins can see "write" endpoints.
    if (!membership.admin) {
      return respond404();
    }

    // PUT /apps/spaces/:spaceId/:appId
    if (method === 'PUT' && appId) {
      // TODO right now any object is valid. We should validate properties.
      const valid = typeof body === 'object' && body !== null && !Array.isArray(body);

      if (!valid) {
        return respond422();
      }

      const updated = { ...apps, [appId]: body };
      await kv.set(spaceId, updated);
      return respond(updated);
    }

    // DELETE /apps/space/:spaceId/:appId
    if (method === 'DELETE' && appId) {
      const updated = { ...apps };
      delete updated[appId];
      await kv.set(spaceId, updated);
      return respond(updated);
    }

    return respond404();
  }
};
