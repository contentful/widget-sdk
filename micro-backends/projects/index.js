'use strict';

const handlers = require('./handlers');
const responses = require('./responses');

module.exports = {
  apiVersion: 1,
  dependencies: ['fetch', 'lodash'],
  handle: async ({ req, kv, dependencies }) => {
    const allowedMethods = ['get', 'post', 'put', 'delete'];
    const method = req.method.toLowerCase();

    const [, orgPath, orgId, projectPath, projectId] = req.path.split('/');

    const meta = {
      orgId,
      projectId
    };

    if (orgPath !== 'organizations' || projectPath !== 'projects') {
      return responses.notFound();
    }

    // Special case for getting all projects
    if (!projectId && method === 'get') {
      return handlers.getAll({ req, kv, dependencies, meta });
    }

    // TODO: validate org

    if (!allowedMethods.includes(method)) {
      return responses.notFound();
    }

    return handlers[method]({ req, kv, dependencies, meta });
  }
};
