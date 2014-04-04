'use strict';

angular.module('contentful').factory('aviary', function ($window, environment, $q, $rootScope, jsloader, filepicker) {
    var featherEditor;
    if (!$window.Aviary) {
      var loadFile = jsloader.create('//feather.aviary.com/js/', '//dme0ih8comzn4.cloudfront.net/js/');
      loadFile('feather.js');
    }

    function createEditor() {
      return new $window.Aviary.Feather({
        apiKey: environment.settings.aviary.api_key,
        apiVersion: 2,
        onSave: function(imageID, newURL) {
          console.log('aviary saved', imageID, newURL);
          //filepicker.store(imageID, newURL);
        },
        appendTo: '',
        onError: function () {
          console.log('aviary error', arguments);
        }
      });
    }

    return {
      createEditor: function (params) {
        if(!featherEditor) featherEditor = createEditor();
        featherEditor.launch(params);
      }
    };
});
