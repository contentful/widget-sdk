'use strict';

angular.module('contentful').factory('filepicker', ['$injector', function ($injector) {
  var $q          = $injector.get('$q');
  var $rootScope  = $injector.get('$rootScope');
  var LazyLoader  = $injector.get('LazyLoader');
  var environment = $injector.get('environment');

  var MULTIPLE_UPLOAD_MAXFILES = 20;

  var filepicker;

  var settings = {
    policy: environment.settings.filepicker.policy,
    signature: environment.settings.filepicker.signature
  };

  function setup(fp) {
    filepicker = fp;
    filepicker.setKey(environment.settings.filepicker.api_key);
    if(environment.env == 'development') {
      LazyLoader.get('filepickerDebug');
    }
  }

  function loadScript() {
    return $q(function(resolve, reject) {
      LazyLoader.get('filepicker')
      .then(function(fp) {
        setup(fp);
        resolve();
      }, reject);
    });
  }

  var loadedScript = loadScript();

  function makeFPCb(deferred, method) {
    return function (val) {
      $rootScope.$apply(function () {
        deferred[method](val);
      });
    };
  }


  return {
    makeDropPane: function (dropPane, options) {
      return loadedScript.then(function() {
        options = _.extend(_.clone(settings), options||{});
        return filepicker.makeDropPane(dropPane, options);
      });
    },

    pick: function (options) {
      return loadedScript.then(function() {
        var deferred = $q.defer();
        options = _.extend(_.clone(settings), options||{});
        filepicker.pick(
          options,
          makeFPCb(deferred, 'resolve'),
          makeFPCb(deferred, 'reject')
        );

        return deferred.promise;

      });
    },

    pickMultiple: function (options) {
      return loadedScript.then(function() {
        var deferred = $q.defer();
        options = _.extend(_.clone(settings), _.defaults(options||{}, {maxFiles: MULTIPLE_UPLOAD_MAXFILES}));

        filepicker.pickMultiple(
          options,
          makeFPCb(deferred, 'resolve'),
          makeFPCb(deferred, 'reject')
        );

        return deferred.promise;

      });
    },


    store: function (newURL, file) {
      return loadedScript.then(function() {
        var deferred = $q.defer();

        filepicker.store(
          {
            url: newURL,
            filename: file.fileName,
            mimetype: file.contentType,
            isWriteable: true,
            size: file.details.size
          },
          _.clone(settings),
          makeFPCb(deferred, 'resolve'),
          makeFPCb(deferred, 'reject')
        );
        return deferred.promise;
      });
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
