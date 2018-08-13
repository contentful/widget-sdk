import modalDialog from 'modalDialog';
import keycodes from 'utils/keycodes';


const minLength = 1;
const maxLength = 32;

export default function SaveViewDialog ({
  allowViewTypeSelection = false,
  allowRoleAssignment = false
}) {
  return modalDialog.open({
    template: '<react-component class="modal-background" name="app/ContentList/SaveViewDialogComponent" props="props"/>',
    controller: function ($scope) {
      render('', false);

      function render (value, isShared) {
        const trimmed = value.trim();
        const isInvalid = trimmed.length < minLength || trimmed.length > maxLength;

        $scope.props = {
          value,
          maxLength,
          allowViewTypeSelection,
          isShared,
          trimmed,
          minLength,
          confirmLabel: isShared && allowRoleAssignment ? 'Proceed and select roles' : 'Save view',
          confirm: () => !isInvalid && $scope.dialog.confirm({ title: trimmed, isShared }),
          cancel: () => $scope.dialog.cancel(),
          onChange: e => render(e.target.value, isShared),
          onKeyDown: e => e.keyCode === keycodes.ENTER && confirm(),
          setSaveAsShared: saveAsShared => render(value, saveAsShared)
        };

        $scope.$applyAsync();
      }
    }
  });
}
