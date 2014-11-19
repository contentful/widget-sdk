'use strict';

angular.module('contentful').factory('aviary', ['$window', 'environment', '$q', '$rootScope', 'jsloader', 'filepicker', 'client', 'delay', function ($window, environment, $q, $rootScope, jsloader, filepicker, client, delay) {
    if (!$window.Aviary) {
      var loadFile = jsloader.create('//feather.aviary.com/js/', '//dme0ih8comzn4.cloudfront.net/js/');
      loadFile('feather.js');
    }

    var featherEditor, file, createDeferred, onClose;

    function createEditor() {
      var initDeferred = $q.defer();
      var saveButtonWasClicked = false;
      if(featherEditor)
        initDeferred.resolve();
      else
        featherEditor = new $window.Aviary.Feather({
          apiKey: environment.settings.aviary.api_key,
          apiVersion: 2,
          isPremiumPartner: 1,
          encryptionMethod: 'sha1',
          appendTo: '',
          displayImageSize: true,
          onLoad: function () {
            initDeferred.resolve();
          },
          onSaveButtonClicked: function () {
            saveButtonWasClicked = true;
            featherEditor.saveHiRes();
            return false;
          },
          onClose: function (dirty) {
            // The asynchronicity of this method is very unpredictable
            if(onClose) delay(function () {
              onClose({
                dirty: dirty,
                saveWasClicked: saveButtonWasClicked
              });
            }, 0);
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
        createDeferred.reject({
          message: 'There has been a problem saving the file',
          error: {
            obj: err,
            type: 'filepicker'
          }
        });
      });
    }

    function onError(error) {
      createDeferred.reject({
        message: 'There was a problem editing the file',
        error: {
          obj: error,
          type: 'aviary'
        }
      });
    }

    function getIntegrationToken() {
      return client.getIntegrationToken('aviary');
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
        $q.all([getIntegrationToken(), createEditor()]).then(function (results) {
          var aviaryToken = results[0];
          file = params.file; delete params.file;
          onClose = params.onClose; delete params.onClose;
          params.hiresUrl = params.url;
          params.timestamp = aviaryToken.timestamp;
          params.signature = aviaryToken.signature;
          params.salt = aviaryToken.salt;

          featherEditor.launch(params);
        }).catch(function (errors) {
          createDeferred.reject({
            message: 'There was a problem initializing the editor',
            error: {
              obj: errors,
              type: 'initialize'
            }
          });
        });
        return createDeferred.promise;
      }
    };
}]);
