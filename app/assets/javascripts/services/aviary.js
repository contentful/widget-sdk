'use strict';

angular.module('contentful').factory('aviary', function ($window, environment, $q, $rootScope, jsloader, filepicker, client) {
    if (!$window.Aviary) {
      var loadFile = jsloader.create('//feather.aviary.com/js/', '//dme0ih8comzn4.cloudfront.net/js/');
      loadFile('feather.js');
    }

    var featherEditor, file, createDeferred, onClose;

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
          onClose: function () {
            if(onClose) onClose();
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
          if(onClose) onClose();
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
});
