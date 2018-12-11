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
export async function fetchAll(endpoint, path, batchLimit, params, headers) {
  const responses = await makeRequests(endpoint, path, batchLimit, params, headers);
  const resources = _(responses)
    .map('items')
    .flatten()
    .value();
  return _.uniqBy(resources, r => r.sys.id);
}

// TODO: Move all `fetchAll` uses in UI to `fetchAllWithIncludes` and remove `fetchAll`
export async function fetchAllWithIncludes(endpoint, path, batchLimit, params, headers) {
  const responses = await makeRequests(endpoint, path, batchLimit, params, headers);
  const result = {
    total: 0,
    items: [],
    includes: {}
  };

  result.items = _(responses)
    .map('items')
    .flatten()
    .value();

  responses.forEach(response => {
    result.total += response.items.length;

    if (response.includes) {
      Object.entries(response.includes).forEach(([key, items]) => {
        result.includes[key] = (result.includes[key] || []).concat(items);
      });
    }
  });

  return result;
}

async function makeRequests(endpoint, path, batchLimit, params, headers) {
  const requestPromises = [];
  let query = _.extend({}, params, { skip: 0, limit: batchLimit });

  const response = await makeRequest(endpoint, path, query, headers);

  requestPromises.push(response);

  const total = response.total;
  let skip = batchLimit;

  while (skip < total) {
    query = _.extend({}, params, { skip, limit: batchLimit });
    requestPromises.push(makeRequest(endpoint, path, query, headers));
    skip += batchLimit;
  }

  return $q.all(requestPromises);
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
