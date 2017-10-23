import {h} from 'ui/Framework';
import {byName as colors} from 'Styles/Colors';
import modalDialog from 'modalDialog';
import keycodes from 'keycodes';

export default function SaveViewDialog ({ showSaveAsSharedCheckbox = false }) {
  return modalDialog.open({
    template: '<cf-component-bridge class="modal-background" component="component">',
    controller: function ($scope) {
      const minLength = 1;
      const maxLength = 32;
      const cancel = () => $scope.dialog.cancel();
      const confirmLabels = {
        true: 'Proceed and select roles',
        false: 'Add to views'
      };
      let shouldSaveCurrentViewAsShared = false;
      let value = '';

      render(value);

      function onSaveAsSharedChange () {
        shouldSaveCurrentViewAsShared = !shouldSaveCurrentViewAsShared;
        render(value);
      }

      function onInput (e) {
        value = e.target.value;
        render(value);
      }

      function renderSaveOptions ({name, text, subText, isChecked, onChange}) {
        return h('li', [
          h('input', {
            type: 'radio',
            name: name,
            onChange,
            checked: isChecked
          }),
          h('span', {style: {marginLeft: '5px'}}, [
            h('label', text),
            h('p', {style: {marginLeft: '22px', color: colors.textLight}}, subText)
          ])
        ]);
      }

      function render (value) {
        const trimmed = value.trim();
        const isInvalid = trimmed.length < minLength || trimmed.length > maxLength;
        const confirm = () => !isInvalid && $scope.dialog.confirm({ viewTitle: trimmed, shouldSaveCurrentViewAsShared });
        const onKeydown = e => e.keyCode === keycodes.ENTER && confirm();

        $scope.component = h('.modal-dialog', [
          h('header.modal-dialog__header', [
            h('i.fa.fa-pencil', { style: { marginRight: '15px' } }),
            h('h1', ['Save current view']),
            h('button.modal-dialog__close', {onClick: cancel})
          ]),
          h('.modal-dialog__content', [
            h('p.modal-dialog__richtext', ['Name of the view']),
            h('input.cfnext-form__input--full-size', {
              type: 'text', value, onInput, onKeydown, maxLength: String(maxLength)
            }),
            showSaveAsSharedCheckbox && (
              h('ul', {style: {marginTop: '20px'}}, [
                renderSaveOptions({
                  name: 'saveAsPrivate',
                  text: ['Save under ', h('em', ['my']), ' views'],
                  subText: ['Only you will see this view.'],
                  onChange: onSaveAsSharedChange,
                  isChecked: !shouldSaveCurrentViewAsShared
                }),
                renderSaveOptions({
                  name: 'saveAsShared',
                  text: ['Save under ', h('em', ['all']), ' views'],
                  subText: ['You can select which roles should see this view in the next step.'],
                  onChange: onSaveAsSharedChange,
                  isChecked: shouldSaveCurrentViewAsShared
                })
              ])
            )
          ]),
          h('.modal-dialog__controls', [
            h('button.btn-primary-action', {
              onClick: confirm,
              disabled: isInvalid
            }, [confirmLabels[shouldSaveCurrentViewAsShared]]),
            h('button.btn-secondary-action', {onClick: cancel}, ['Cancel'])
          ])
        ]);

        $scope.$applyAsync();
      }

    }

  });
}
