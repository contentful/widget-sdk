import modalDialog from 'modalDialog';

export default function SaveViewDialog({
  allowViewTypeSelection = false,
  allowRoleAssignment = false
}) {
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
