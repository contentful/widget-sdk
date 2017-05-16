'use strict';

angular.module('contentful')
.factory('client', ['$injector', function ($injector) {
  var $q = $injector.get('$q');
  var environment = $injector.get('environment');
  var Client = $injector.get('libs/@contentful/client').Client;
  var auth = $injector.get('Authentication');
  var makeRequest = $injector.get('data/Request').default;

  var baseRequest = makeRequest(auth);
  var baseUrl = environment.settings.apiUrl;
  var defaultHeaders = {
    'X-Contentful-Skip-Transformation': true,
    'Content-Type': 'application/vnd.contentful.management.v1+json'
  };

  return _.extend(new Client({request: request}), {
    request: request
  });

  function request (req) {
    req = buildRequest(req);
    return baseRequest(req)
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
}]);
