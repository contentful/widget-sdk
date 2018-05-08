angular.module('contentful').directive('cfEntryEditor', [
  'require',
  function (require) {
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
        function ($scope) {
          return createEditorController($scope, $scope.entryId);
        }
      ]
    };
  }
]);
