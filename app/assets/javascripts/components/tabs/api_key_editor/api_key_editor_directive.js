angular.module('contentful').directive('apiKeyEditor', ['modalDialog', 'keycodes', 'defer', function(modalDialog, keycodes, defer) {
  'use strict';
  return {
    template: JST.api_key_editor(),
    restrict: 'C',
    controller: 'ApiKeyEditorCtrl',
    link: function(scope, elem) {
      elem.on('keydown', function(e) {
        if (e.keyCode === keycodes.ENTER) scope.save();
      });

      scope.showRegenerateWarning = function () {
        if(!scope.apiKey.data.regenerateAccessToken){
          modalDialog.open({
            scope: scope,
            template: 'regenerate_warning_dialog'
          }).catch(function () {
            scope.apiKey.data.regenerateAccessToken = false;
          });
        }
      };
    }
  };
}]);
