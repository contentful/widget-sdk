import {h} from 'utils/hyperscript';

export default function () {
  return h('ul.user-role-selector', {}, [
    h('li.user-role-selector__user', {
      ngRepeat: 'user in users track by user.sys.id'
    }, [
      h('cf-user-link', {
        user: 'user'
      }),
      h('.user-role-selector__selector-field.cfnext-form__field', [
        h('label', { for: 'user-role-{{user.sys.id}}' }, ['User\'s role']),
        h('select.cfnext-select-box', {
          id: 'user-role-{{user.sys.id}}',
          ngModel: 'selectedRoles[user.sys.id]',
          ariaInvalid: '{{ validate ? ( selectedRoles[user.sys.id] ? "false" : "true" ) : null }}'
        }, [
          h('option', {
            value: '',
            selected: true,
            disabled: true
          }, ['Select role']),
          h('option', {
            ngRepeat: 'role in roleOptions track by role.id',
            value: '{{ role.id }}'
          }, ['{{ role.name }}'])
        ])
      ])
    ])
  ]);
}
