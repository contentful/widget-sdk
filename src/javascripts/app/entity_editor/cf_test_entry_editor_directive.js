angular.module('contentful').directive('cfTestEntryEditor', [
  'require',
  require => {
    const createEditorController = require('app/entity_editor/EntryController.es6').default;

    return {
      restrict: 'E',
      scope: true,
      template: JST.entry_editor(),
      controller: ['$scope', createEditorController]
    };
  }
]);
