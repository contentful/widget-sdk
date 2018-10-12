import modalDialog from 'modalDialog';

/**
 * @ngdoc service
 * @name app/InputDialog
 * @description
 * Exports a generic input dialog constructor.
 */

/**
 * @ngdoc method
 * @name app/InputDialog#open
 * @description
 * Opens a dialog enabling user to provide a single textual value.
 *
 * @param {string}  params.title        Dialog's title
 * @param {string}  params.message      Dialog's message
 * @param {string}  params.confirmLabel Confirmation label (delfaut: "OK")
 * @param {string}  params.cancelLabel  Cancelation label (default: "Cancel")
 * @param {string}  params.input.value  Initial value of the input
 * @param {string}  params.input.min    Minimal required length (default: 0)
 * @param {string}  params.input.max    Maximal allowed length (default: +Inf)
 *
 * @returns {Promise<string>}
 */

export default function open(params = {}) {
  const { input = {} } = params;
  input.value = input.value || '';
  input.min = input.min || 0;
  input.max = input.max || +Infinity;

  return modalDialog.open({
    template:
      '<react-component name="app/InputDialogComponent.es6" props="props" class="modal-background">',
    controller: function($scope) {
      const { min, max, regex, value } = input;
      const onCancel = () => $scope.dialog.cancel({ cancelled: true });

      const onConfirm = value => {
        const trimmed = value.trim();
        isValid(trimmed) && $scope.dialog.confirm(trimmed);
      };

      $scope.props = { params, confirm, onCancel, initialValue: value, onConfirm, isValid };
      if (isFinite(input.max)) {
        $scope.props.maxLength = input.max;
      }

      function isValid(trimmed = '') {
        if (regex) {
          return regex.test(trimmed);
        } else {
          return trimmed.length >= min && trimmed.length <= max;
        }
      }
    }
  });
}
