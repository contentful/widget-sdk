'use strict';

angular.module('contentful')
.directive('cfApiKeyEditor', function () {
  return {
    template: JST.api_key_editor(),
    restrict: 'E',
    controller: 'ApiKeyEditorController',
    controllerAs: 'apiKeyEditorController'
  };
});
