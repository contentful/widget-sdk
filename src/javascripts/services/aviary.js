'use strict';

angular.module('contentful')
.factory('aviary', ['require', function (require) {
  var $q = require('$q');
  var $window = require('$window');
  var angularLoad = require('angularLoad');
  var client = require('client');
  var delay = require('delay');
  var environment = require('environment');

  if (!$window.Aviary) {
    angularLoad.loadScript(
      'https://dme0ih8comzn4.cloudfront.net/imaging/v1/editor.js');
  }

  var featherEditor, createDeferred, onClose;

  function createEditor () {
    var initDeferred = $q.defer();
    var saveButtonWasClicked = false;
    if (featherEditor) {
      initDeferred.resolve();
    } else {
      featherEditor = new $window.Aviary.Feather({
        apiKey: environment.settings.aviary.api_key,
        appendTo: '',
        displayImageSize: true,
        enableCORS: true,
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
          if (onClose) {
            delay(function () {
              onClose({
                dirty: dirty,
                saveWasClicked: saveButtonWasClicked
              });
            }, 0);
          }
        },
        onSaveHiRes: onSave,
        onError: onError
      });
    }
    return initDeferred.promise;
  }

  function onSave (_imageID, newURL) {
    featherEditor.showWaitIndicator();
    createDeferred.resolve(newURL);
  }

  function onError (error) {
    createDeferred.reject({
      message: 'There was a problem editing the file',
      error: {
        obj: error,
        type: 'aviary'
      }
    });
  }

  function getIntegrationToken () {
    return client.getIntegrationToken('aviary');
  }

  return {
    close: function () {
      if (featherEditor) {
        featherEditor.hideWaitIndicator();
        featherEditor.close();
      }
    },

    createEditor: function (params) {
      createDeferred = $q.defer();
      $q.all([getIntegrationToken(), createEditor()]).then(function (results) {
        var aviaryToken = results[0];
        onClose = params.onClose;
        delete params.onClose;
        params.encryptionMethod = 'sha1';
        params.hiresUrl = params.url;
        params.timestamp = aviaryToken.timestamp;
        params.signature = aviaryToken.signature;
        params.salt = aviaryToken.salt;

        featherEditor.launch(_.clone(params));
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
