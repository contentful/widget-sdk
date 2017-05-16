import {h} from 'utils/hyperscript';

export default function () {
  return h('div', [
    h('p', [
      'There are no users in your organization who are not part of this space already. ',
      h('span', { ngIf: 'canInviteUsersToOrganization()' }, [
        'Go to ',
        h('a', { href: '', ngClick: 'goToOrganizationUsers()' }, ['organizations & billings']),
        ' to invite new users to your organization.'
      ]),
      h('span', { ngIf: '!canInviteUsersToOrganization()' }, [
        'Get in touch with an organization owner or admin to invite new users to your organization.'
      ])
    ]),
    h('button.btn-primary-action.modal-dialog__controls-confirm', {
      type: 'button',
      ngClick: 'dialog.cancel()',
      style: { margin: '10px 0' }
    }, ['Okay, got it'])
  ]);
}
