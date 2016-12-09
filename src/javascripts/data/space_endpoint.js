'use strict';

angular.module('cf.data')
/**
 * @ngdoc service
 * @module cf.data
 * @name data/spaceEndpoint
 * @usage[js]
 * var spaceEndpoint = $injector.get('data/spaceEndpoint')
 * var makeRequest = spaceEndpoint.create('TOKEN', '//api.contentful.com', 'SPACE_ID')
 * var entries = makeRequest({
 *   method: 'GET',
 *   path: ['entries'],
 *   query: {limit: 10}
 * })
 * var asset = makeRequest({
 *   method: 'PUT',
 *   path: ['assets', 'asset-id'],
 *   version: 12,
 *   data: assetData
 * })
 */
.factory('data/spaceEndpoint', ['require', function (require) {
  var $http = require('$http');
  var $q = require('$q');
  var RequestQueue = require('data/RequestQueue');

  return {create: create};

  /**
   * @ngdoc method
   * @name data/spaceEndpoint#create
   * @description
   * Return a function that makes requests to a space resource.
   *
   * The request function accepts a configuration object with the
   * following parameters.
   *
   * - `method` The HTTP method to use
   * - `path` Array of strings that is joined with `/`. It is relative to
   *   `/spaces/SPACE_ID`.
   * - `query` An object that is converted to URL query parameters.
   * - `data` JSON object to send as the payload of the request
   * - `version` If given, its value is send as the
   *   `X-Contentful-Version` header.
   *
   * The request function accepts a map of additional headers as a
   * second argument.
   *
   * The resolved response will contain the payload parsed as a JSON
   * object. If the request fails the promise will be rejected with an
   * error.
   *
   * The error will have the following properties
   *
   * - `status` The HTTP response code
   * - `code` Either the `sys.id` property from the response or the
   *   HTTP status code
   * - `data` The HTTP response body
   * - `request` The original request configuration
   * - `headers` The HTTP response headers
   *
   * @param {string} token
   * @param {string} baseUrl
   * @param {string} spaceId
   * @returns {function}
   */
  function create (token, baseUrl, spaceId) {
    return RequestQueue.create(makeRequest);

    function makeRequest (config, headers) {
      var url = joinPath([baseUrl, 'spaces', spaceId].concat(config.path));
      var request = {
        method: config.method,
        url: url,
        headers: makeHeaders(config.version, headers),
        data: config.data,
        params: config.query
      };

      return $http(request).then(function (response) {
        return response.data;
      }, function (response) {
        var status = parseInt(response.status, 10);
        var error = _.extend(new Error('API request failed'), {
          status: status,
          // We duplicate this proprty because it is required by the
          // request queue.
          statusCode: status,
          code: dotty.get(response, ['data', 'sys', 'id'], response.status),
          data: response.data,
          headers: response.headers,
          request: redactAuthorizationHeader(request)
        });
        return $q.reject(error);
      });
    }

    function makeHeaders (version, additional) {
      var headers = _.extend({
        'Content-Type': 'application/vnd.contentful.management.v1+json',
        'Authorization': 'Bearer ' + token
      }, additional);
      if (version) {
        headers['X-Contentful-Version'] = version;
      }
      return headers;
    }
  }

  function joinPath (components) {
    return _.filter(components).join('/');
  }

  function redactAuthorizationHeader (request) {
    if (request.headers['Authorization']) {
      request = _.cloneDeep(request);
      request.headers['Authorization'] = '[REDACTED]';
    }
    return request;
  }
}]);
