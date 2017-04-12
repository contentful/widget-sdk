import {h} from 'utils/hyperscript';

// @TODO add 'go back' button

export default function () {
  return h('.modal-background', [
    h('article.modal-dialog.user-space-invitation-dialog', {
      ngController: 'UserSpaceInvitationController'
    }, [
      h('header.modal-dialog__header', [
        h('h1', ['Add users to space']),
        h('button.modal-dialog__close', { ngClick: 'dialog.cancel()' })
      ]),
      dialogContent(),
      h('.modal-dialog__controls', [
        h('button.btn-primary-action', {
          ngIf: '!invitationsScheduled',
          ngClick: 'tryInviteSelectedUsers()'
        }, ['Add selected {{ users.length === 1 ? "user" : "users (" + users.length + ")" }}']),
        h('button.btn-primary-action.is-loading', {
          ngIf: 'invitationsScheduled > 0'
        }, ['Adding {{ users.length === 1 ? "user…" : "users… (" + invitationsDone + " of " + invitationsScheduled + ")" }}']),
        h('button.btn-secondary-action', { ngClick: 'dialog.cancel()' }, ['Cancel'])
      ])
    ])
  ]);
}

function dialogContent () {
  return h('.modal-dialog__content', [
    h('h2.user-space-invitation-dialog__step-label', [
      '{{ users.length === 1 ? "Assign a role to selected user" : "Assign roles to selected users" }}'
    ]),
    h('cf-user-role-selector', {
      roleOptions: 'roleOptions',
      users: 'users',
      selectedRoles: 'selectedRoles',
      validate: '{{ canNotInvite }}'
    }, []),
    h('p.user-space-invitation-dialog__faq-link', [
      h('cf-knowledge-base', {
        target: 'roles',
        text: 'What\'s the difference between Administrator, Developer and Editor?',
        inlineText: 'true'
      })
    ]),
    h('.note-box.note-box--warning', { ngIf: 'canNotInvite' }, [
      'You are trying to add {{ getInvalidRoleSelectionsCount() === 1 ? ' +
      '"a user without a role. Please assign the user" : ' +
      'getInvalidRoleSelectionsCount() + " users without a role. Please assign them" }} ' +
      'a role before continuing.'
    ]),
    h('.note-box.note-box--warning', { ngIf: 'hasFailedInvitations' }, [
      'Whoops, something went wrong on our side. There ' +
      '{{ users.length === 1 ? "is one user" : "are some users" }} we weren’t able to ' +
      'add to your space. Press the green button once more to add the remaining ' +
      '{{ users.length === 1 ? "user" : "users" }}, and everything should be fine.'
    ])
  ]);
}
