'use strict';
angular.module('contentful').factory('GAPIAdapter', ['$injector', function($injector){

  var $q          = $injector.get('$q');
  var $window     = $injector.get('$window');
  var $rootScope  = $injector.get('$rootScope');
  var environment = $injector.get('environment');

  function GAPIAdapter(){
    $window.gapi.client.setApiKey(environment.settings.google.gapi_key);
  }

  GAPIAdapter.prototype = {
    request: function(params){
      var deferred = $q.defer(),
          request;

      request = gapi.client.request(params);
      request.execute(function(json){
        $rootScope.$apply(function(){
          json.error ? deferred.reject() : deferred.resolve(json.items);
        });
      });

      return deferred.promise;
    }
  };

  return new GAPIAdapter();
}]);

