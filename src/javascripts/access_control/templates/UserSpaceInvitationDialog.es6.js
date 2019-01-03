import { h } from 'utils/legacy-html-hyperscript/index.es6';

export default function() {
  return h('.modal-background', [
    h(
      'article.modal-dialog.user-space-invitation-dialog',
      {
        ngController: 'UserSpaceInvitationController as userSpaceInvitation'
      },
      [
        h('header.modal-dialog__header', [
          h('h1', ['Add users to space']),
          h('button.modal-dialog__close', { ngClick: 'dialog.cancel()' })
        ]),
        dialogContent(),
        h('.modal-dialog__controls', [
          h(
            'button.btn-primary-action',
            {
              ngIf: '!invitationsScheduled',
              ngClick: 'userSpaceInvitation.tryInviteSelectedUsers()'
            },
            ['Add selected {{ users.length === 1 ? "user" : "users (" + users.length + ")" }}']
          ),
          h(
            'button.btn-primary-action.is-loading',
            {
              ngIf: 'invitationsScheduled > 0'
            },
            [
              'Adding {{ users.length === 1 ? "user…" : "users… (" + invitationsDone + " of " + invitationsScheduled + ")" }}'
            ]
          ),
          h('button.btn-secondary-action', { ngClick: 'dialog.cancel()' }, ['Cancel'])
        ])
      ]
    )
  ]);
}

function dialogContent() {
  return h('.modal-dialog__content', [
    h('div', { style: { position: 'relative' } }, [
      h('h2.user-space-invitation-dialog__step-label', [
        '{{ users.length === 1 ? "Assign a role to selected user" : "Assign roles to selected users" }}'
      ]),
      h(
        'a.text-link--neutral-emphasis-low',
        {
          href: '',
          ngClick: 'goBackToSelection()',
          style: { position: 'absolute', top: 0, right: 0 }
        },
        ['Edit selection']
      )
    ]),
    userRoleSelector(),
    h('p', [
      h('cf-knowledge-base', {
        target: 'roles',
        text: "What's the difference between Administrator, Developer and Editor?",
        cssClass: 'text-link--neutral-emphasis-low',
        inlineText: 'true'
      })
    ]),
    h(
      '.note-box--warning',
      { ngIf: 'canNotInvite && userSpaceInvitation.getInvalidRoleSelectionsCount() > 0' },
      [
        'You are trying to add {{ userSpaceInvitation.getInvalidRoleSelectionsCount() === 1 ? ' +
          '"a user without a role. Please assign the user" : ' +
          'userSpaceInvitation.getInvalidRoleSelectionsCount() + " users without a role. Please assign them" }} ' +
          'a role before continuing.'
      ]
    ),
    h('.note-box--warning', { ngIf: 'hasFailedInvitations' }, [
      'Whoops, something went wrong on our side. There ' +
        '{{ users.length === 1 ? "is one user" : "are some users" }} we weren’t able to ' +
        'add to your space. Press the green button once more to add the remaining ' +
        '{{ users.length === 1 ? "user" : "users" }}, and everything should be fine.'
    ])
  ]);
}

function userRoleSelector() {
  return h('ul.user-role-selector', [
    h(
      'li.user-role-selector__user',
      {
        ngRepeat: 'user in users track by user.sys.id'
      },
      [
        h('cf-user-link', {
          user: 'user'
        }),
        h('.user-role-selector__selector-field', [
          h(
            'select.cfnext-select-box',
            {
              id: 'user-role-{{user.sys.id}}',
              ngModel: 'selectedRoles[user.sys.id]',
              ariaInvalid: '{{ canNotInvite && !selectedRoles[user.sys.id] }}'
            },
            [
              h(
                'option',
                {
                  value: '',
                  selected: true,
                  disabled: true
                },
                ['Select role']
              ),
              h(
                'option',
                {
                  ngRepeat: 'role in roleOptions track by role.id',
                  value: '{{ role.id }}'
                },
                ['{{ role.name }}']
              )
            ]
          )
        ])
      ]
    )
  ]);
}
