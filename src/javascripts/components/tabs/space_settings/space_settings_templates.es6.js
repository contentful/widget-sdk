import {h} from 'utils/hyperscript';
import {simple as simpleWorkbench} from 'app/Workbench';
import {richtextLayout} from 'modalDialog';
import pageSettingsIcon from 'svg/page-settings';

export function form () {
  const actions = [
    h('button.btn-caution',
      {uiCommand: 'openRemovalDialog'},
      ['Remove space and all its contents']
    ),
    h('button.btn-primary-action', {uiCommand: 'save'}, ['Save'])
  ];

  return simpleWorkbench({
    title: [ 'Space settings' ],
    icon: pageSettingsIcon,
    actions
  }, [
    h('.cfnext-form__field', [
      h('label', {for: 'space-id'}, ['Space ID:']),
      h('input#space-id.cfnext-form__input--full-size',
        {type: 'text',
          value: '{{spaceId}}',
          readonly: 'readonly',
          cfSelectAllInput: true})
    ]),
    h('.cfnext-form__field', [
      h('label', {for: 'space-name'}, ['Space name:']),
      h('input#space-name.cfnext-form__input--full-size',
        {type: 'text', ngModel: 'model.name'})
    ])
  ]);
}

export function removalConfirmation () {
  const content = [
    h('p', [
      'You are about to remove space ',
      h('span.modal-dialog__highlight', {ngBind: 'spaceName'}), '.'
    ]),
    h('p', [
      h('strong', [
        `All space contents and the space itself will be removed.
         This operation cannot be undone.`
      ])
    ]),
    h('p', ['To confirm, type the name of the space in the field below:']),
    h('input.cfnext-form__input--full-size', {ngModel: 'input.spaceName'})
  ];

  const controls = [
    h('button.btn-caution', {uiCommand: 'remove'}, ['Remove']),
    h('button.btn-secondary-action', {ngClick: 'dialog.cancel()'}, ['Don’t remove'])
  ];

  return richtextLayout('Remove space', content, controls);
}
