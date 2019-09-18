import { getModule } from 'NgRegistry.es6';

export default function SaveViewDialog({
  allowViewTypeSelection = false,
  allowRoleAssignment = false
}) {
  const modalDialog = getModule('modalDialog');

  return modalDialog.open({
    template:
      '<react-component class="modal-background" name="app/ContentList/SaveViewDialogComponent.es6" props="props"/>',
    controller: function($scope) {
      $scope.props = {
        confirm: values => $scope.dialog.confirm(values),
        cancel: () => $scope.dialog.cancel(),
        allowViewTypeSelection,
        allowRoleAssignment: !!allowRoleAssignment
      };
    }
  });
}
