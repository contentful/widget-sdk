import {h} from 'utils/hyperscript';
import {simple as simpleWorkbench} from 'app/Workbench';
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
