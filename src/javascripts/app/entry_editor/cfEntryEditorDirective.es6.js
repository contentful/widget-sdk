import { registerDirective } from 'NgRegistry.es6';

registerDirective('cfEntryEditor', [
  'app/entity_editor/EntryController.es6',
  ({ default: createEditorController }) => ({
    restrict: 'E',
    scope: {
      entryId: '<',
      preferences: '<'
    },
    template: JST.entry_editor(),
    controller: ['$scope', $scope => createEditorController($scope, $scope.entryId)]
  })
]);
