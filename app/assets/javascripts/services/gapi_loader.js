'use strict';
angular.module('contentful').factory('gapiLoader', ['$injector', function($injector){

  var $q          = $injector.get('$q');
  var GAPIAdapter = $injector.get('GAPIAdapter');

  var deferreds = [];
  var loaded    = false;
  var loading   = false;

  window.OnLoadCallback = OnLoadCallback;

  function OnLoadCallback(){
    loaded = true;
    _.each(deferreds, function(defer){ defer.resolve(GAPIAdapter.instance()); });
  }

  function loadGapi() {
    loading = true;
    var tag            = document.createElement('script'),
        firstScriptTag = document.getElementsByTagName('script')[0];

    tag.src = "https://apis.google.com/js/client.js?onload=OnLoadCallback";
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  return {
    load : function(){
      var defer = $q.defer();

      loaded ? defer.resolve(GAPIAdapter.instance()) : deferreds.push(defer);

      if (!loading) loadGapi();

      return defer.promise;
    }
  };
}]);

