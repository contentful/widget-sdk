'use strict';

angular.module('contentful').factory('aviary', function ($window, environment, $q, $rootScope, jsloader, filepicker, client) {
    if (!$window.Aviary) {
      var loadFile = jsloader.create('//feather.aviary.com/js/', '//dme0ih8comzn4.cloudfront.net/js/');
      loadFile('feather.js');
    }

    var featherEditor, file, createDeferred;

    function createEditor() {
      var initDeferred = $q.defer();
      if(featherEditor)
        initDeferred.resolve();
      else
        featherEditor = new $window.Aviary.Feather({
          apiKey: environment.settings.aviary.api_key,
          apiVersion: 2,
          encryptionMethod: 'sha1',
          appendTo: '',
          onLoad: function () {
            initDeferred.resolve();
          },
          onSaveButtonClicked: function () {
            featherEditor.saveHiRes();
            return false;
          },
          onSaveHiRes: onSave,
          onError: onError
        });
      return initDeferred.promise;
    }

    function onSave(imageID, newURL) {
      featherEditor.showWaitIndicator();
      filepicker.store(newURL, file)
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

    function getIntegrationToken() {
      var token = $q.defer();
      client.getIntegrationToken('aviary', function (err, data) {
        if(err) token.reject(err);
        else token.resolve(data);
      });
      return token.promise;
    }

    return {
      close: function () {
        if(featherEditor) {
          featherEditor.hideWaitIndicator();
          featherEditor.close();
        }
      },

      createEditor: function (params) {
        createDeferred = $q.defer();
        $q.all([getIntegrationToken(), createEditor()]).then(function (aviaryToken) {
          file = params.file;
          delete params.file;
          params.hiresUrl = params.url;
          params.timestamp = aviaryToken.timestamp;
          params.signature = aviaryToken.signature;
          params.salt = aviaryToken.salt;

          featherEditor.launch(params);
        });
        return createDeferred.promise;
      }
    };
});
