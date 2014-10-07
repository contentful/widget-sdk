'use strict';

angular.module('contentful').provider('client', ['contentfulClient', function ClientProvider(contentfulClient) {
  var endpoint = null;

  this.endpoint = function(e) {
    endpoint = e;
  };

  var Client = contentfulClient.Client;

  this.$get = ['$injector', function($injector) {
    var $http = $injector.get('$http');
    var $q    = $injector.get('$q');
    
    function AngularAdapter(server, token) {
      this.server = server;
      this.token  = token;

      this._performRequest = function (o) {
        var options = {
          method:       o.method,
          url:          '' + this.server + o.endpoint,
          headers: {
            'Content-Type':  'application/vnd.contentful.management.v1+json',
          },
        };
        _.extend(options.headers, o.headers);
        if (this.token) {
          options.headers = options.headers || {};
          options.headers['Authorization'] = 'Bearer '+this.token;
        }

        if (o.payload !== undefined) {
          if (o.method == 'GET') {
            options.params = o.payload;
          } else {
            options.data = o.payload;
          }
        }

        var deferred = $q.defer();
        $http(options)
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
    }
    _.extend(AngularAdapter.prototype, contentfulClient.adapters.jquery.prototype);

    return new Client(new AngularAdapter(endpoint));
  }];


}]);
