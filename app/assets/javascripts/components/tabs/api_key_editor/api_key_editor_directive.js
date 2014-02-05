angular.module('contentful').directive('apiKeyEditor', function(modalDialog, keycodes) {
  'use strict';
  return {
    template: JST.api_key_editor(),
    restrict: 'C',
    controller: 'ApiKeyEditorCtrl',
    link: function(scope, elem) {
      elem.on('keydown', function(e) {
        if (e.keyCode === keycodes.ENTER) scope.save();
      });
      _.defer(function(){elem.find('input').eq(0).focus();});

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
});
