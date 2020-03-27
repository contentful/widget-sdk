import { extend, map } from 'lodash';

/**
 * Allows resources to create child resources that inherit the
 * parent's persistence context.
 */
export default function mixinChildResourceFactory(target) {
  extend(target, {
    /**
     * Return a function that creates an instance or a list of
     * instances of 'Constructor' from a server response.
     *
     * The instances inherit the parent resource's persistence context
     * with 'path' added to it.
     */
    childResourceFactory: function (Constructor, path) {
      const persistenceContext = this.childPersistenceContext(path);
      function construct(data) {
        const entity = new Constructor(data, persistenceContext);
        return persistenceContext.store(entity);
      }

      return function entitiesFromResponse(response) {
        if (!response) {
          throw new Error('Response not available');
        }

        if ('sys' in response && response.sys.type === 'Array') {
          const entities = map(response.items, construct);
          Object.defineProperty(entities, 'total', { value: response.total });
          return entities;
        } else {
          return construct(response);
        }
      };
    },

    childPersistenceContext: function (path) {
      const endpoint = this.endpoint(path).deleteHeader('X-Contentful-Version');
      return this.persistenceContext.withEndpoint(endpoint);
    },
  });
}
