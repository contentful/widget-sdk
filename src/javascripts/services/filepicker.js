'use strict';

angular.module('contentful').factory('filepicker', ['$injector', function ($injector) {
  var $q          = $injector.get('$q');
  var $rootScope  = $injector.get('$rootScope');
  var $window     = $injector.get('$window');
  var angularLoad = $injector.get('angularLoad');
  var environment = $injector.get('environment');

  var MULTIPLE_UPLOAD_MAXFILES = 20;

  if (!$window.filepicker) {
    angularLoad.loadScript('https://api.filepicker.io/v1/filepicker.js');
    if(environment.env == 'development') {
      angularLoad.loadScript('https://api.filepicker.io/v1/filepicker_debug.js');
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
      options = _.extend(_.clone(settings), options||{});
      return $window.filepicker.makeDropPane(dropPane, options);
    },

    pick: function (options) {
      var deferred = $q.defer();

      $window.filepicker.pick(_.extend(_.clone(settings), options||{}), function(FPFile){
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

    pickMultiple: function (options) {
      var deferred = $q.defer();
      _.defaults(options||{}, {maxFiles: MULTIPLE_UPLOAD_MAXFILES});

      $window.filepicker.pickMultiple(_.extend(_.clone(settings), options), function(FPFiles){
        $rootScope.$apply(function () {
          deferred.resolve(FPFiles);
        });
      }, function (FPError) {
        $rootScope.$apply(function () {
          deferred.reject(FPError);
        });
      });

      return deferred.promise;
    },


    store: function (newURL, file) {
      var deferred = $q.defer();

      $window.filepicker.store({
        url: newURL,
        filename: file.fileName,
        mimetype: file.contentType,
        isWriteable: true,
        size: file.details.size
      },
      _.clone(settings),
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
    },

    parseFPFile: function (FPFile) {
      return FPFile ? {
       upload:      FPFile.url,
       fileName:    FPFile.filename,
       contentType: FPFile.mimetype
      } : null;
    }
  };
}]);
