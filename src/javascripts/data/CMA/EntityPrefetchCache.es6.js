import { transform, flatten, chunk, uniq } from 'lodash';
import { getModule } from 'NgRegistry.es6';

const $q = getModule('$q');

// The maximum number of IDs to query for in one request.
//
// This restricted by the maximum length of the URL. This limit is
// client and server specific. We assume a 2000 character limit for
// clients.
//
// Generated entity IDs have a lenght of 21 characters. This means that
// the query value (including the comma separator) will be at most
// 22*50 = 1100 characters long. A bound on the ID lenght enforced by
// the API is not known
const IDS_PER_QUERY = 50;

/**
 * @ngdoc service
 * @name data/CMA/EntityPrefetchCache
 * @description
 * This module exports a function that creates a cache for entities
 * that allows bulk prefetch.
 *
 * ~~~js
 * const cache = createCache(queryEntities)
 *
 * // eagerly load multiple IDs in one request
 * cache.set(['id1', 'id2'])
 *
 * // Waits for the bulk request and returns the entitiy
 * yield cache.get('id1')
 *
 * // Not in cache. Issues a new request
 * yield cache.get('id3')
 * ~~~
 *
 * If `set()` is called with a new set of IDs it will
 * only request those IDs which are not in the cache yet.
 *
 * ~~~js
 * cache.set(['id1'])
 * // Only fetch id2
 * cache.set(['id1', 'id2'])
 * ~~~
 *
 * Conversely, `set()` will remove IDs not required anymore from the
 * cache.
 *
 * ~~~js
 * cache.set(['id1', 'id2'])
 * cache.set(['id1'])
 * // Not in cache. Will fall back to requesting the entity
 * cache.get('id2')
 * ~~~
 */
// TODO This share a lot of code with “EntityResolver”. However this
// here uses the query methods and entity objects from
// `@contentful/client` while the other service uses the barebone CMA
// space api.
export default function(queryEntities) {
  const entities = {};

  return {
    set(ids) {
      // IDs not cached already
      const newIds = ids.filter(id => !entities[id]);

      // IDs cached but now requested
      const oldIds = Object.keys(entities).filter(id => ids.indexOf(id) === -1);

      oldIds.forEach(id => delete entities[id]);
      addEntities(newIds);
    },
    get(id) {
      if (!entities[id]) {
        addEntities([id]);
      }
      return entities[id];
    }
  };

  function addEntities(ids) {
    const req = getEntitiesById(queryEntities, ids).then(entities => {
      return transform(
        entities,
        (byId, entity) => {
          byId[entity.data.sys.id] = entity;
        },
        {}
      );
    });

    ids.forEach(id => {
      entities[id] = req.then(byId => byId[id]);
    });
  }
}

/**
 * Fetches entities from a list of IDs in bulk. Resolves with an array
 * containing the entities.
 *
 * @param {function(query): Promise<Entity[]>} queryEntities
 * @param {string[]} ids
 * @returns {Promise<Entity[]>}
 */
function getEntitiesById(queryEntities, ids) {
  const queries = chunk(uniq(ids), IDS_PER_QUERY).map(ids =>
    queryEntities({
      'sys.id[in]': ids.join(','),
      limit: IDS_PER_QUERY
    })
  );

  return $q.all(queries).then(flatten);
}
