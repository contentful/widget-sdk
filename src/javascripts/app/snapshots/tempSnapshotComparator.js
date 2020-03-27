import { registerDirective, registerController } from 'NgRegistry';

export default function register() {
  /**
   * @ngdoc directive
   * @module cf.app
   * @name cfSnapshotComparator
   * @description
   * This directive is responsible for rendering
   * of the comparison view. Its controller (and
   * small child controllers) allow users to choose
   * between field versions and restore composed
   * version of an entry at the end of the process.
   */
  registerDirective('cfSnapshotComparator', () => ({
    template: `
      <react-component
        name="app/snapshots/SnapshotComparator"
        props="{ widgets, snapshot, getEditorData, registerSaveAction, setDirty, redirect, goToSnapshot }"
      ></react-component>
    `,
    restrict: 'E',
    controller: 'SnapshotComparatorController',
  }));

  registerController('SnapshotComparatorController', [
    '$scope',
    '$state',
    function SnapshotComparatorController($scope, $state) {
      // Temporary: Adding helper functions - before separating angular and react on route level in next step
      $scope.getEditorData = () => $scope.editorData;

      $scope.registerSaveAction = (save) => {
        $scope.context.requestLeaveConfirmation = save;
        $scope.$applyAsync();
      };
      $scope.setDirty = (value) => {
        $scope.context.dirty = value;
        $scope.$applyAsync();
      };

      $scope.redirect = (reload) => {
        if (reload) return $state.go('^.^', {}, { reload: true });
        return $state.go('^.^');
      };
      $scope.goToSnapshot = (snapshotId) => {
        $scope.context.ready = false;
        $state.go('.', { snapshotId, source: 'compareView' });
      };

      $scope.context.ready = true;
    },
  ]);
}
