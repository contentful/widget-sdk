'use strict';
angular.module('contentful').factory('GAPIAdapter', ['$injector', function($injector){

  var $q = $injector.get('$q');
  var environment = $injector.get('environment');

  function GAPIAdapter(){
    gapi.client.setApiKey(environment.settings.google.gapi_key);
  }

  GAPIAdapter.instance = function(){
    if (this.__instance__) return this.__instance__;

    this.__instance__ = new GAPIAdapter();
    return this.__instance__;
  };

  GAPIAdapter.prototype = {
    request: function(params){
      var deferred = $q.defer(),
          request;

      request = gapi.client.request(params);
      request.execute(function(json){
        json.error ? deferred.reject() : deferred.resolve(json.items);
      });

      return deferred.promise;
    }
  };

  return GAPIAdapter;
}]);

