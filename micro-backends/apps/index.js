'use strict';

const { respond, respond404, respond422 } = require('./responses.js');
const getSpaceMembership = require('./space-membership.js');
const makeSanitizer = require('./sanitize');
const sendRequest = require('./send-request');

module.exports = {
  apiVersion: 1,
  memorySize: 512,
  timeout: 5,
  dependencies: ['lodash', 'fetch'],
  handle: async ({ req, kv, dependencies }) => {
    const { path, method, body, headers } = req;
    const { mergeHiddenFields, sanitizeListOfApps } = makeSanitizer(dependencies.lodash);

    // URLs are: `/apps/spaces/:spaceId/:appId`.
    // `/apps/` is the backend name and is not included in `path`.
    const [spacesSegment, spaceId, appId, appAction] = path
      .split('/')
      .filter(s => typeof s === 'string' && s.length > 0);

    // "/spaces/:spaceId" component is required.
    if (spacesSegment !== 'spaces' || !spaceId) {
      return respond404();
    }

    const tokenStart = Date.now();

    // Fetch a space membership.
    // If there's no membership for token/space ID pair - respond with 401.
    let membership = null;
    try {
      const token = headers['x-contentful-token'];
      const api = headers['x-contentful-api'];
      membership = await getSpaceMembership(dependencies, spaceId, token, api);
    } catch (err) {
      const tokenTime = { name: 'token-time', value: Date.now() - tokenStart };
      return respond({ message: err.message }, err.status || 500, [tokenTime]);
    }

    const tokenTime = { name: 'token-time', value: Date.now() - tokenStart };

    // Get apps for a space from KV.
    const apps = (await kv.get(spaceId)) || {};

    // GET /apps/spaces/:spaceId
    if (method === 'GET' && !appId) {
      return respond(sanitizeListOfApps(apps), 200, [tokenTime]);
    }

    // POST /apps/spaces/:spaceId/:appId/request
    if (method === 'POST' && appAction === 'request') {
      // Context keeps the values that are available for the custom request options.
      const app = apps[appId] || {};
      const context = { ...app.secrets };

      // For the time being we only need GET requests for Optimizely.
      // Let's limit HTTP methods available to this app for extra
      // security until we've got proper Secrets API.
      const forceGet = appId === 'optimizely';

      let resp, body;

      try {
        resp = await sendRequest(context, req.body, dependencies.fetch, forceGet);
        body = await resp.text();
      } catch (err) {
        return respond("Bad request. Make sure you've passed valid request options.", 400, [
          tokenTime
        ]);
      }

      return respond({ ok: resp.ok, status: resp.status, body }, 200, [tokenTime]);
    }

    // Only admins can see "write" endpoints.
    if (!membership.admin) {
      return respond404([tokenTime]);
    }

    // PUT /apps/spaces/:spaceId/:appId
    if (method === 'PUT' && appId) {
      // TODO right now any object is valid. We should validate properties.
      const valid = typeof body === 'object' && body !== null && !Array.isArray(body);

      if (!valid) {
        return respond422([tokenTime]);
      }

      const updated = { ...apps, [appId]: mergeHiddenFields(apps[appId] || {}, body) };
      await kv.set(spaceId, updated);
      return respond(sanitizeListOfApps(updated), 200, [tokenTime]);
    }

    // DELETE /apps/space/:spaceId/:appId
    if (method === 'DELETE' && appId) {
      const updated = { ...apps };
      delete updated[appId];
      await kv.set(spaceId, updated);
      return respond(sanitizeListOfApps(updated), 200, [tokenTime]);
    }

    return respond404([tokenTime]);
  }
};
