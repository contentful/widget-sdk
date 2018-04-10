/**
* @ngdoc service
* @name data/CMA/EntityResolver
* @description
* Load and cache the payload of entities for given IDs
*
* Used by the cfReferenceEditor and cfSnapshotPresentLink directives.
*/
import {caseof} from 'sum-types/caseof-eq';
import $q from '$q';
import {chunk, uniq, flatten} from 'lodash';

const MAX_IN_IDS = 50;

/**
 * @ngdoc method
 * @name data/CMA/EntityResolver#forType
 *
 * @param {string} type
 *   Either 'Entry' or 'Asset'
 * @param {API.Client} space
 *   Same interface as defined by `data/ApiClient`
 * @returns {EntityResolver}
 */
export function forType (type, space) {
  return caseof(type, [
    ['Entry', function () {
      return create(function (query) {
        return space.getEntries(query);
      });
    }],
    ['Asset', function () {
      return create(function (query) {
        return space.getAssets(query);
      });
    }]
  ]);
}

function create (fetch) {
  let entitiesById = {};

  /**
   * @ngdoc type
   * @name EntityResolver
   * @description
   * Resolve entity payloads for IDs with builtin caching
   */
  return {
    load: load,
    addEntity: addEntity,
    reset: reset
  };

  /**
   * @ngdoc type
   * @name EntityResolver#load
   * @description
   * Given a list of entity IDs this method fetches the entity payload from
   * the API.
   *
   * The method resolves to alist of `[id, entity]` pairs where `entity` is the
   * payload corresponding to the ID. If the entity does not exist on the
   * server the `entity` is `null`. If an ID has been requested before the
   * method will not refetch it but load it from its cache. The same holds if
   * an entity has been added through the `add()` method.
   *
   * The order of the IDs in the output list is the same as the order of `ids`
   * argument.
   *
   * @param {string[]} ids
   * @returns {Promise<[[string, API.Entity?]]>}
   */
  function load (ids) {
    const newIDs = ids.filter(function (id) {
      // Entities that do not exist on the server have value
      // 'undefined'. We do not want to refetch them.
      return !(id in entitiesById);
    });

    return getEntities(fetch, newIDs)
    .then(function (entities) {
      entities.forEach(addEntity);
      return ids.map(function (id) {
        return [id, entitiesById[id]];
      });
    });
  }

  /**
   * @ngdoc type
   * @name EntityResolver#addEntity
   * @description
   * Add an entity to the resolver cache. Subsequent `load()` calls will use
   * the added entity.
   */
  function addEntity (entity) {
    entitiesById[entity.sys.id] = entity;
  }

  function reset () {
    entitiesById = {};
  }
}


/**
 * Accepts a list of IDs and fetches and returns the entity data for each of
 * these ids.
 *
 * The order of the returned entities does not correspond to the
 * order of the IDs.
 *
 * If we get a 404 we return an empty array since this indicates that
 * we do not have access to the entities.
 *
 * @param {function(query)} fetch
 *   Queries the apropriate resource collection endpoint
 * @param {string[]} ids
 *   List of entity IDs to query for
 * @returns {Promise<API.Entity[]>}
 */
function getEntities (fetch, ids) {
  const queries = chunk(uniq(ids), MAX_IN_IDS)
  .map(function (ids) {
    return fetch({
      'sys.id[in]': ids.join(','),
      limit: MAX_IN_IDS
    }).then((response) => {
      return response.items;
    }, (errorResponse) => {
      if (errorResponse.status === 404) {
        return [];
      } else {
        return $q.reject(errorResponse);
      }
    });
  });

  return $q.all(queries).then(flatten);
}
