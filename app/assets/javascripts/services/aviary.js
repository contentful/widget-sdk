'use strict';

angular.module('contentful').factory('aviary', function ($window, environment, $q, $rootScope, jsloader, filepicker) {
    var featherEditor;
    if (!$window.Aviary) {
      var loadFile = jsloader.create('//feather.aviary.com/js/', '//dme0ih8comzn4.cloudfront.net/js/');
      loadFile('feather.js');
    }

    function createEditor(file, deferred) {
      return new $window.Aviary.Feather({
        apiKey: environment.settings.aviary.api_key,
        apiVersion: 2,
        onSave: function(imageID, newURL) {
          console.log('aviary saved', imageID, newURL, file);
          filepicker.store(imageID, newURL, file).then(
            function (res) {
              deferred.resolve(res);
            },
            function (err) {
              deferred.reject(err);
            });
        },
        appendTo: '',
        onError: function () {
          console.log('aviary error', arguments);
        }
      });
    }

    return {
      createEditor: function (params) {
        var deferred = $q.defer();
        featherEditor = createEditor(params.file, deferred);
        delete params.file;
        featherEditor.launch(params);
        return deferred.promise;
      }
    };
});
