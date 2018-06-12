angular.module('contentful').directive('cfEntryEditor', [
  'require',
  require => {
    var createEditorController = require('app/entity_editor/EntryController')
      .default;
    return {
      restrict: 'E',
      scope: {
        entryId: '<',
        preferences: '<'
      },
      template: JST.entry_editor(),
      controller: [
        '$scope',
        $scope => createEditorController($scope, $scope.entryId)
      ]
    };
  }
]);
