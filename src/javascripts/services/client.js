'use strict';

angular.module('contentful')
.factory('client', ['require', function (require) {
  var $q = require('$q');
  var Config = require('Config');
  var Client = require('libs/legacy-client');
  var auth = require('Authentication');
  var makeRequest = require('data/Request').default;

  var baseRequest = makeRequest(auth);
  var baseUrl = Config.apiUrl().slice(0, -1); // Remove trailing slash
  var defaultHeaders = {
    'X-Contentful-Skip-Transformation': true,
    'Content-Type': 'application/vnd.contentful.management.v1+json'
  };

  return _.extend(new Client({request: request}), {
    request: request,
    createSpace: createSpace
  });

  function request (req) {
    req = buildRequest(req);
    return baseRequest(req)
    .then(function (res) {
      return res.data;
    }, function (res) {
      // @todo most likely we should reject with an Error instance
      return $q.reject({
        // We duplicate this property because `statusCode` is used througout the code base
        statusCode: parseInt(res.status, 10),
        status: res.status,
        body: res.data,
        request: req
      });
    });
  }

  function buildRequest (data) {
    var req = {
      method: data.method,
      url: [baseUrl, data.path.replace(/^\/+/, '')].join('/'),
      headers: _.extend({}, defaultHeaders, data.headers)
    };

    var payloadProperty = data.method === 'GET' ? 'params' : 'data';
    req[payloadProperty] = data.payload;

    return req;
  }

  function createSpace (payload, organizationId) {
    return request({
      method: 'POST',
      path: '/spaces',
      payload: payload,
      headers: {'X-Contentful-Organization': organizationId}
    });
  }
}]);
