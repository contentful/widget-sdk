'use strict';

const handlers = require('./handlers');
const responses = require('./responses');
const checkAuthorization = require('./checkAuthorization');

module.exports = {
  apiVersion: 1,
  dependencies: ['fetch', 'lodash'],
  handle: async ({ req, kv, dependencies }) => {
    const allowedMethods = ['get', 'post', 'delete'];
    const method = req.method.toLowerCase();

    const [, orgPath, orgId, projectPath, projectId] = req.path.split('/');

    const meta = {
      orgId,
      projectId
    };

    // Fetch a org membership.
    // If there's no membership for token/space ID pair - respond with 401.
    try {
      const token = req.headers['x-contentful-token'];
      const api = req.headers['x-contentful-api'];
      await checkAuthorization(dependencies, orgId, token, api);
    } catch (err) {
      return responses.notFound();
    }

    if (orgPath !== 'organizations' || projectPath !== 'projects') {
      return responses.notFound();
    }

    // Special case for getting all projects
    if (!projectId && method === 'get') {
      return handlers.getAll({ req, kv, dependencies, meta });
    }

    if (!allowedMethods.includes(method)) {
      return responses.notFound();
    }

    return handlers[method]({ req, kv, dependencies, meta });
  }
};
