import _ from 'lodash';
import { getModule } from 'NgRegistry.es6';

const $q = getModule('$q');

/**
 * @ngdoc service
 * @name data/CMA/FetchAll
 * @description
 * This module exports a function that will request all resources for
 * a given endpoint.
 *
 * Accepts the following arguments:
 * - `endpoint`. An instance of `data/Endpoint`.
 * - `path`. The API path to request, e.g. `['users']`.
 * - `batchLimit`. An integer, representing the maximum number of resources
 *   to retrieve per request.
 * - `params`. An optional object with query params.
 */

/**
 * @ngdoc method
 * @name data/CMA/FetchAll#fetchAll
 * @param {Endpoint} endpoint
 * @param {array} path
 * @param {integer} batchLimit
 * @param {Object} params
 * @returns {array}
 */
export function fetchAll(endpoint, path, batchLimit, params, headers) {
  const requestPromises = [];
  let query = _.extend({}, params, { skip: 0, limit: batchLimit });

  return makeRequest(endpoint, path, query, headers).then(response => {
    const total = response.total;
    let skip = batchLimit;

    while (skip < total) {
      query = _.extend({}, params, { skip, limit: batchLimit });
      requestPromises.push(makeRequest(endpoint, path, query));
      skip += batchLimit;
    }

    return $q.all(requestPromises).then(requests => {
      const resources = _(requests)
        .map('items')
        .flatten()
        .value();
      const allResources = response.items.concat(resources);
      return _.uniqBy(allResources, r => r.sys.id);
    });
  });
}

function makeRequest(endpoint, path, query, headers) {
  return endpoint(
    {
      method: 'GET',
      path,
      query
    },
    headers
  );
}
