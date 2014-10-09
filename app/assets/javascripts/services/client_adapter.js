'use strict';

angular.module('contentful').provider('clientAdapter', [function ClientAdapter() {
  var server = null;

  this.server = function(s) { server = s; };

  this.$get = ['$injector', function($injector) {
    var $http = $injector.get('$http');
    var $q    = $injector.get('$q');

    function Adapter(server, token) {
      this.server = server;
      this.token  = token;
    }

    Adapter.prototype = {
      request: function(options) {
        var defaults = {
          url     : '' + this.server + options.endpoint,
          headers : {
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
      },

      _performRequest: this.request
    };

    return new Adapter(server);
  }];
}]);

