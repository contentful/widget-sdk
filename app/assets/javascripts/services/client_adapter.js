'use strict';

angular.module('contentful').provider('clientAdapter', ['$injector', function ClientAdapter($injector) {
  var contentfulClient = $injector.get('contentfulClient');
  var server           = null;

  this.server = function(s) { server = s; };

  this.$get = ['$injector', function($injector) {
    var $http = $injector.get('$http');
    var $q    = $injector.get('$q');

    function Adapter(server, token) {
      this.server = server;
      this.token  = token;
    }

    Adapter.prototype = new contentfulClient.adapters.Base();
    Adapter.prototype._performRequest = function(options) {
      var defaults = {
        url     : '' + this.server + options.endpoint,
        headers : {
          'X-Contentful-Skip-Transformation': true,
          'Content-Type':  'application/vnd.contentful.management.v1+json',
        }
      };

      var request  = {};
      var deferred = $q.defer();

      _.extend(defaults.headers, options.headers);
      _.extend(request, options, defaults);

      if (this.token)
        request.headers['Authorization'] = 'Bearer '+this.token;

      if (options.method == 'GET') {
        request.params = options.payload;
      } else {
        request.data = options.payload;
      }

      $http(request)
      .success(function(data) {
        deferred.resolve(data);
      })
      .error(function(data, status) {
        deferred.reject({
          statusCode: status,
          body: data
        });
      });

      return deferred.promise;
    };
    var originalRequest = Adapter.prototype.request;
    Adapter.prototype.request = function(){
      return $q.when(originalRequest.apply(this, arguments));
    };

    return new Adapter(server);
  }];
}]);
