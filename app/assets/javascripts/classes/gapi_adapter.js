'use strict';
angular.module('contentful').factory('GAPIAdapter', ['$q', function($q){
  var API_KEY = 'AIzaSyAJi3XBLmzo1lOzZ0RncjVQWVlF_wkC4ow';


  function GAPIAdapter(){
    gapi.client.setApiKey(API_KEY);
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

