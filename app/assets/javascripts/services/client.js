angular.module('contentful').provider('client', ['contentfulClient', function ClientProvider(contentfulClient) {
  'use strict';

  var endpoint = null;

  this.endpoint = function(e) {
    endpoint = e;
  };

  var Client = contentfulClient.Client;

  this.$get = ['$injector', function($injector) {
    var $http = $injector.get('$http');
    
    function AngularAdapter(server, token) {
      this.server = server;
      this.token  = token;

      this._performRequest = function (o, callback) {
        var options = {
          method:       o.method,
          url:          '' + this.server + o.endpoint,
          contentType:  'application/vnd.contentful.management.v1+json',
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

        $http(options)
        .success(function(data) {
          if (typeof callback == 'function') callback(null, data);
        })
        .error(function(data, status) {
          if (typeof callback == 'function') callback({
            statusCode: status,
            body: data
          });
        });
      };
    }
    _.extend(AngularAdapter.prototype, contentfulClient.adapters.jquery.prototype);

    return new Client(new AngularAdapter(endpoint));
  }];


}]);
