'use strict';

angular.module('contentful')
.factory('clientAdapter', ['$injector', function ClientAdapter($injector) {
  var $http = $injector.get('$http');
  var $q = $injector.get('$q');
  var BaseAdapter = $injector.get('privateContentfulClient').Adapter;
  var environment = $injector.get('environment');

  var server = '//'+ environment.settings.api_host;

  function performRequest(request) {
    return $http(request)
    .then(function (res) {
      return res.data;
    }, function (res) {
      return $q.reject({
        statusCode: parseInt(res.status, 10),
        body: res.data,
        request: request
      });
    });
  }

  function Adapter(server) {
    BaseAdapter.call(this, server, performRequest);
    this.setHeader('X-Contentful-Skip-Transformation', true);
    this.setHeader('Content-Type', 'application/vnd.contentful.management.v1+json');
  }

  Adapter.prototype = Object.create(BaseAdapter.prototype);

  Adapter.prototype.setToken = function (token) {
    this.setHeader('Authorization', 'Bearer ' + token);
  };

  // TODO add retry logic when we run into rate limiting
  Adapter.prototype.request = function(){
    var response = BaseAdapter.prototype.request.apply(this, arguments);
    return $q.when(response);
  };

  return new Adapter(server);
}]);
