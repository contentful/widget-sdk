'use strict';

angular.module('contentful').provider('clientAdapter', ['$injector', function ClientAdapter($injector) {
  var BaseAdapter = $injector.get('privateContentfulClient').Adapter;
  var server      = null;

  this.server = function(s) { server = s; };

  this.$get = ['$injector', function($injector) {
    var $http = $injector.get('$http');
    var $q    = $injector.get('$q');

    function performRequest(request) {
      return $http(request)
      .then(function (res) {
        return res.data;
      }, function (res) {
        return $q.reject({
          statusCode: res.status,
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

    Adapter.prototype.request = function(){
      if (this.token)
        this.setHeader('Authorization', 'Bearer ' + this.token);
      var response = BaseAdapter.prototype.request.apply(this, arguments);
      return $q.when(response);
    };

    return new Adapter(server);
  }];
}]);
