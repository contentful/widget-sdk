'use strict';

angular.module('cf.app')
.directive('cfJsonEditorCodeEditor', [() => ({
  restrict: 'E',
  scope: { editor: '=' },
  template: JST.cf_json_editor_code_editor(),

  link: function ($scope, $el) {
    $scope.editor.attach($el.find('[data-editor]'));
    $scope.$on('$destroy', $scope.editor.destroy);
  }
})]);
