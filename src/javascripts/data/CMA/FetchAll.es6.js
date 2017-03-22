import $q from '$q';
import _ from 'lodash';

/**
 * @ngdoc service
 * @name data/CMA/FetchAll
 * @description
 * This module exports a function that will request all resources for
 * a given endpoint.
 *
 * Accepts the following arguments:
 * - `spaceEndpoint`. An instance of `data/spaceEndpoint`.
 * - `path`. The API path to request, e.g. `['users']`.
 * - `batchLimit`. An integer, representing the maximum number of resources
 *   to retrieve per request.
 */

/**
 * @ngdoc method
 * @name data/CMA/FetchAll#fetchAll
 * @param {SpaceEndpoint} spaceEndpoint
 * @param {array} path
 * @param {integer} batchLimit
 * @returns {array}
 */
export function fetchAll (spaceEndpoint, path, batchLimit) {
  let query = { skip: 0, limit: batchLimit };
  const requestPromises = [];

  return makeRequest(spaceEndpoint, path, query).then((response) => {
    const total = response.total;
    let skip = batchLimit;

    while (skip < total) {
      query = { skip: skip, limit: batchLimit };
      requestPromises.push(makeRequest(spaceEndpoint, path, query));
      skip += batchLimit;
    }

    return $q.all(requestPromises).then((requests) => {
      const resources = _(requests).map('items').flatten().value();
      const allResources = response.items.concat(resources);
      return _.uniqBy(allResources, (r) => r.sys.id);
    });
  });
}

function makeRequest (spaceEndpoint, path, query) {
  return spaceEndpoint({
    method: 'GET',
    path: path,
    query: query
  });
}
