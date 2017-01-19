'use strict';

angular.module('contentful')
.factory('client', ['$injector', function ($injector) {
  var $http = $injector.get('$http');
  var $q = $injector.get('$q');
  var environment = $injector.get('environment');
  var createRequestQueue = $injector.get('data/RequestQueue').create;
  var Client = $injector.get('libs/@contentful/client').Client;

  var baseUrl = environment.settings.apiUrl;
  var defaultHeaders = null;
  var queuedRequestFn = createRequestQueue(request);

  return _.extend(new Client({request: queuedRequestFn}), {
    init: init,
    request: queuedRequestFn
  });

  function init (token) {
    defaultHeaders = {
      'X-Contentful-Skip-Transformation': true,
      // @todo content_api's preflight middleware has to accept this header first
      // 'X-Contentful-UI-Version': window.CF_UI_VERSION || 'development',
      'Content-Type': 'application/vnd.contentful.management.v1+json',
      Authorization: 'Bearer ' + token
    };
  }

  function request (req) {
    if (!defaultHeaders) {
      throw new Error('Call #init(token) first!');
    }

    return performRequest(buildRequest(req));
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

  function performRequest (req) {
    return $http(req)
    .then(function (res) {
      return res.data;
    }, function (res) {
      // @todo most likely we should reject with an Error instance
      return $q.reject({
        statusCode: parseInt(res.status, 10),
        body: res.data,
        request: req
      });
    });
  }
}]);
