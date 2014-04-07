'use strict';

angular.module('contentful').factory('aviary', function ($window, environment, $q, $rootScope, jsloader, filepicker) {
    if (!$window.Aviary) {
      var loadFile = jsloader.create('//feather.aviary.com/js/', '//dme0ih8comzn4.cloudfront.net/js/');
      loadFile('feather.js');
    }

    var featherEditor, file, createDeferred;
    var saveLock = false;

    function createEditor() {
      var initDeferred = $q.defer();
      if(featherEditor)
        initDeferred.resolve();
      else
        featherEditor = new $window.Aviary.Feather({
          apiKey: environment.settings.aviary.api_key,
          apiVersion: 2,
          appendTo: '',
          onLoad: function () {
            initDeferred.resolve();
          },
          onSave: onSave,
          onSaveButtonClicked: onSaveButtonClicked,
          onClose: onClose,
          onError: onError
        });
      return initDeferred.promise;
    }

    function onSaveButtonClicked() {
      saveLock = true;
    }

    function onSave(imageID, newURL) {
      console.log('aviary saved', imageID, newURL, file);
      filepicker.store(imageID, newURL, file)
      .then(function (res) {
        createDeferred.resolve(res);
      })
      .catch(function (err) {
        createDeferred.reject(err);
      });
    }

    function onError(error) {
      createDeferred.reject({
        message: 'Aviary Error',
        error: error
      });
    }

    function onClose(dirty) {
      if(dirty || saveLock) return false;
    }

    return {
      unlock: function () {
        saveLock = false;
      },

      createEditor: function (params) {
        createDeferred = $q.defer();
        file = params.file;
        delete params.file;
        createEditor().then(function () {
          featherEditor.launch(params);
        });
        return createDeferred.promise;
      }
    };
});
