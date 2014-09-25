'use strict';
angular.module('contentful').factory('gapiLoader', ['$q', 'GAPIAdapter', function($q, GAPIAdapter){
  var loading   = false,
      loaded    = false,
      deferreds = [];

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

      loaded ? defer.resolve(gapi) : deferreds.push(defer);

      if (!loading) loadGapi();

      return defer.promise;
    }
  };
}]);

