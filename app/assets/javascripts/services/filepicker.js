'use strict';

angular.module('contentful').factory('filepicker', function ($window, environment, $q, $rootScope, jsloader) {
    if (!$window.filepicker) {
      var loadFile = jsloader.create('//api.filepicker.io/v1/');
      loadFile('filepicker.js');
      if(environment.env == 'development'){
        loadFile('filepicker_debug.js');
      }
      var d = {};
      d._queue = [];
      var e = 'pick,pickMultiple,pickAndStore,read,write,writeUrl,export,convert,store,storeUrl,remove,stat,setKey,constructWidget,makeDropPane'.split(',');
      var f = function (a, b) {
          return function () {
              b.push([a, arguments]);
          };
      };
      for (var g = 0; g < e.length; g++) {
          d[e[g]] = f(e[g], d._queue);
      }
      $window.filepicker = d;

      d.setKey(environment.settings.filepicker.api_key);
    }

    var settings = {
      policy: environment.settings.filepicker.policy,
      signature: environment.settings.filepicker.signature
    };

    return {
      makeDropPane: function (dropPane, options) {
        options = _.extend(settings, options);
        return $window.filepicker.makeDropPane(dropPane, options);
      },

      pick: function () {
        var deferred = $q.defer();

        $window.filepicker.pick(settings, function(FPFile){
          $rootScope.$apply(function () {
            deferred.resolve(FPFile);
          });
        }, function (FPError) {
          $rootScope.$apply(function () {
            deferred.reject(FPError);
          });
        });

        return deferred.promise;
      },

      store: function (imageID, newURL, file) {
        var deferred = $q.defer();

        $window.filepicker.store({
          url: newURL,
          filename: file.fileName,
          mimetype: file.contentType,
          isWriteable: true,
          size: file.details.size
        },
        settings,
        function(FPFile){
          $rootScope.$apply(function () {
            deferred.resolve(FPFile);
          });
        }, function (FPError) {
          $rootScope.$apply(function () {
            deferred.reject(FPError);
          });
        });

        return deferred.promise;
      }
    };
});
