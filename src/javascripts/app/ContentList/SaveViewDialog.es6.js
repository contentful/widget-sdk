import modalDialog from 'modalDialog';

export default function SaveViewDialog ({
  allowViewTypeSelection = false,
  allowRoleAssignment = false
}) {
  return modalDialog.open({
    template: '<react-component class="modal-background" name="app/ContentList/SaveViewDialogComponent" props="props"/>',
    controller: function ($scope) {
      $scope.props = {
        confirm: values => $scope.dialog.confirm(values),
        cancel: () => $scope.dialog.cancel(),
        minLength: 1,
        maxLength: 32,
        allowViewTypeSelection,
        allowRoleAssignment: !!allowRoleAssignment
      };

      $scope.$applyAsync();
    }
  });
}
