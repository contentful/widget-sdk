import {h} from 'ui/Framework';

import modalDialog from 'modalDialog';
import keycodes from 'keycodes';

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
 * @param {string}  params.input.value  Initial value of the input
 * @param {string}  params.input.min    Minimal required length (default: 0)
 * @param {string}  params.input.max    Maximal allowed length (default: +Inf)
 *
 * @returns {Promise<string>}
 */

export default function open (params = {}) {
  const input = params.input || {};
  input.value = input.value || '';
  input.min = input.min || 0;
  input.max = input.max || +Infinity;

  return modalDialog.open({
    template: '<cf-component-bridge class="modal-background" component="component">',
    controller: function ($scope) {
      const {min, max, value} = input;
      const maxlength = isFinite(max) ? `${max}` : '';
      const onInput = e => render(e.target.value);
      const cancel = () => $scope.dialog.cancel();

      render(value);

      function render (value) {
        const trimmed = value.trim();
        const isInvalid = trimmed.length < min || trimmed.length > max;
        const confirm = () => !isInvalid && $scope.dialog.confirm(trimmed);
        const onKeydown = e => e.keyCode === keycodes.ENTER && confirm();

        $scope.component = h('.modal-dialog', [
          h('header.modal-dialog__header', [
            h('h1', [params.title]),
            h('button.modal-dialog__close', {onClick: cancel})
          ]),
          h('.modal-dialog__content', [
            h('p.modal-dialog__richtext', [params.message]),
            h('input.cfnext-form__input--full-size', {
              type: 'text', value, onInput, onKeydown, maxlength
            })
          ]),
          h('.modal-dialog__controls', [
            h('button.btn-primary-action', {
              onClick: confirm,
              disabled: isInvalid
            }, ['OK']),
            h('button.btn-secondary-action', {onClick: cancel}, ['Cancel'])
          ])
        ]);

        $scope.$applyAsync();
      }
    }
  });
}
