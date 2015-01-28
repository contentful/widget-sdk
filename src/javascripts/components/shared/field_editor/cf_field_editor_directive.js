'use strict';

angular.module('contentful').directive('cfFieldEditor', [function() {
  return {
    restrict: 'A',
    require: '^otPath',
    controller: 'CfFieldEditorController',
  };
}]);
