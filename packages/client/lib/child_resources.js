'use strict';

var _ = require('lodash-node/modern');

/**
 * Allows resources to create child resources that inherit the
 * parent's persistence context.
 */
module.exports = function mixinChildResourceFactory (target) {
  _.extend(target, {
    /**
     * Return a function that creates an instance or a list of
     * instances of 'Constructor' from a server response.
     *
     * The instances inherit the parent resource's persistence context
     * with 'path' added to it.
     */
    childResourceFactory: function (Constructor, path) {
      var persistenceContext = this.childPersistenceContext(path);
      function construct (data) {
        var entity = new Constructor(data, persistenceContext);
        return persistenceContext.store(entity);
      }

      return function entitiesFromResponse (response) {
        if (!response) { throw new Error('Response not available'); }

        if ('sys' in response && response.sys.type === 'Array') {
          var entities = _.map(response.items, construct);
          Object.defineProperty(entities, 'total', {value: response.total});
          return entities;
        } else {
          return construct(response);
        }
      };
    },

    childPersistenceContext: function (path) {
      var endpoint = this.endpoint(path).deleteHeader('X-Contentful-Version');
      return this.persistenceContext.withEndpoint(endpoint);
    }
  });
};
