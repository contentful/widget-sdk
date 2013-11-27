angular.module('contentful').directive('apiKeyEditor', function() {
  'use strict';
  return {
    template: JST.api_key_editor(),
    restrict: 'C',
    controller: 'ApiKeyEditorCtrl',
    link: function(scope, elem) {
      elem.on('keydown', function(e) {
        if (e.keyCode === 13) scope.save();
      });
      _.defer(function(){elem.find('input').eq(0).focus();});
    }
  };
});
