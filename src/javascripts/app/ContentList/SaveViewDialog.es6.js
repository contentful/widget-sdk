import {h} from 'ui/Framework';
import {byName as colors} from 'Styles/Colors';
import modalDialog from 'modalDialog';
import keycodes from 'keycodes';


const minLength = 1;
const maxLength = 32;

export default function SaveViewDialog ({
  allowViewTypeSelection = false,
  allowRoleAssignment = false
}) {
  return modalDialog.open({
    template: '<cf-component-bridge class="modal-background" component="component"/>',
    controller: function ($scope) {
      render('', false);

      function renderViewTypeOption ({label, description, checked, select}) {
        return h('li', {
          onClick: select,
          style: {cursor: 'pointer', maxHeight: '50px'}
        }, [
          h('input', {type: 'radio', checked}),
          h('span', {style: {marginLeft: '5px'}}, [
            h('label', label),
            h('p', {style: {marginLeft: '22px', color: colors.textLight}}, [description])
          ])
        ]);
      }

      function render (value, isShared) {
        const trimmed = value.trim();
        const isInvalid = trimmed.length < minLength || trimmed.length > maxLength;
        const confirmLabel = isShared && allowRoleAssignment ? 'Proceed and select roles' : 'Save view';

        const confirm = () => !isInvalid && $scope.dialog.confirm({ title: trimmed, isShared });
        const onInput = e => render(e.target.value, isShared);
        const cancel = () => $scope.dialog.cancel();
        const onKeydown = e => e.keyCode === keycodes.ENTER && confirm();
        const setSaveAsShared = saveAsShared => render(value, saveAsShared);

        $scope.component = h('.modal-dialog', [
          h('header.modal-dialog__header', [
            h('h1', ['Save as view']),
            h('button.modal-dialog__close', {onClick: cancel})
          ]),
          h('.modal-dialog__content', [
            h('p.modal-dialog__richtext',
              {style: {
                marginBottom: '25px'
              }},
              ['A view displays a list of entries you searched for. By saving the current view, you will be able to re-use it later.']),
            h('span', ['Name of the view', h('span.modal-dialog__richtext', [' (required)'])]),
            h('input.cfnext-form__input--full-size', {
              type: 'text', value, onInput, onKeydown, maxLength: `${maxLength}`,
              style: {marginTop: '5px'}
            }),
            allowViewTypeSelection && h('ul', {style: {marginTop: '20px'}}, [
              renderViewTypeOption({
                label: ['Save under ', h('em', ['my views'])],
                description: 'Only you will see this view.',
                select: () => setSaveAsShared(false),
                checked: !isShared
              }),
              renderViewTypeOption({
                label: ['Save under ', h('em', ['all views'])],
                description: 'You can select which roles should see this view in the next step.',
                select: () => setSaveAsShared(true),
                checked: isShared
              })
            ])
          ]),
          h('.modal-dialog__controls', [
            h('button.btn-primary-action', {
              onClick: confirm,
              disabled: isInvalid
            }, [confirmLabel]),
            h('button.btn-secondary-action', {onClick: cancel}, ['Cancel'])
          ])
        ]);

        $scope.$applyAsync();
      }
    }
  });
}
