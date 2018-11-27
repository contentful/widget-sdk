'use strict';

const headers = { 'Content-Type': 'application/json' };
const notFound = { message: 'Not found.' };

const respond = (body, statusCode = 200) => {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers
  };
};

module.exports = {
  apiVersion: 1,
  handle: async ({ req, kv }) => {
    const { path, method, body } = req;

    const [spacesSegment, spaceId, appId] = path
      .split('/')
      .filter(s => typeof s === 'string' && s.length > 0);

    if (spacesSegment !== 'spaces' || !spaceId) {
      return respond(notFound, 404);
    }

    const apps = (await kv.get(spaceId)) || {};

    // GET /apps/spaces/:spaceId
    if (method === 'GET' && !appId) {
      return respond(apps);
    }

    // PUT /apps/spaces/:spaceId/:appId
    if (method === 'PUT' && appId) {
      // TODO right now any object is valid.
      const valid = typeof body === 'object' && body !== null && !Array.isArray(body);

      if (valid) {
        const updated = { ...apps, [appId]: body };
        await kv.set(spaceId, updated);
        return respond(body);
      } else {
        return respond({ message: 'Unprocessable entity.' }, 422);
      }
    }

    return respond(notFound, 404);
  }
};
