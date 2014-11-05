'use strict';

angular.module('contentful').directive('apiKeyEditor', ['keycodes', 'defer', function(keycodes) {
  return {
    template: JST.api_key_editor(),
    restrict: 'C',
    controller: 'ApiKeyEditorController',
    link: function(scope, elem) {
      elem.on('keydown', function(e) {
        if (e.keyCode === keycodes.ENTER) scope.save();
      });
    }
  };
}]);
