import { h } from 'ui/Framework';
import pageSettingsIcon from 'svg/page-settings.es6';
import * as Workbench from 'app/Workbench.es6';

export default function() {
  return h('div.workbench', [
    header(),
    h('.workbench-main', [
      h('.workbench-main__content', [userList()]),
      h('.workbench-main__sidebar', [sidebar()])
    ])
  ]);
}

function header() {
  const actions = [
    h('button.btn-secondary-action', { cfContextMenuTrigger: true }, [
      h('cf-icon.btn-dropdown-icon', { name: 'dd-arrow-down' }, ['{{ viewLabels[selectedView] }}'])
    ]),
    h('.context-menu', { role: 'menu', cfContextMenu: 'bottom-right', ariaLabel: 'Change view' }, [
      h('div', { role: 'menuitem', ngClick: 'selectedView = "name"' }, ['{{ viewLabels.name }}']),
      h('div', { role: 'menuitem', ngClick: 'selectedView = "role"' }, ['{{ viewLabels.role }}'])
    ])
  ];

  return Workbench.header({
    title: ['Users ({{ spaceUsersCount || 0 }})'],
    icon: pageSettingsIcon,
    actions
  });
}

function userList() {
  return h(
    '.user-list__group',
    {
      ngAttrId: '{{ item.id }}',
      ngRepeat: 'item in by[selectedView] track by item.label'
    },
    [
      h('h3', ['{{ item.label }}']),
      h('.user-list__item', { ngRepeat: 'user in item.users track by user.id' }, [
        h('img', { ngSrc: '{{ user.avatarUrl }}', width: '50', height: '50' }),
        h('.user-list__info', [
          h('strong.user-list__name.u-truncate', ['{{ user.name }}']),
          h('small', { ngIf: '!user.confirmed' }, ['This account is not confirmed']),
          h('.user-list__roles', ['{{ user.roleNames }}'])
        ]),
        userContextMenu()
      ])
    ]
  );
}

function userContextMenu() {
  return h('div', [
    h(
      'button.user-list__actions.user-list__actions--disabled.btn-inline',
      {
        ngIf: '!canModifyUsers()'
      },
      ['&bullet;&bullet;&bullet;']
    ),
    h(
      'button.user-list__actions.btn-inline',
      {
        type: 'button',
        ariaLabel: 'Actions',
        cfContextMenuTrigger: true,
        ngIf: 'canModifyUsers()'
      },
      ['&bullet;&bullet;&bullet;']
    ),
    h(
      '.context-menu',
      {
        role: 'menu',
        cfContextMenu: 'bottom-right',
        ariaLabel: 'User Actions'
      },
      [
        h('ul.context-menu__items', [
          h(
            'li',
            {
              role: 'menuitem',
              ngClick: 'openRoleChangeDialog(user)',
              dataUiTrigger: 'user-change-role'
            },
            ['Change role']
          ),
          h(
            'li',
            {
              role: 'menuitem',
              ngClick: 'openRemovalConfirmationDialog(user)',
              dataUiTrigger: 'user-remove-from-space'
            },
            ['Remove from this space']
          )
        ])
      ]
    )
  ]);
}

function sidebar() {
  return h('.entity-sidebar', [
    h('h2.entity-sidebar__heading', ['Add users']),
    h('cf-add-users-to-space-note'),
    // @TODO: use `ui-command` for invitation
    h(
      'button.btn-action.x--block',
      {
        ngClass: '{"is-loading": isInvitingUsersToSpace}',
        ngClick: 'openSpaceInvitationDialog()',
        ngDisabled: '!canModifyUsers()'
      },
      [h('cf-icon.btn-icon.inverted', { name: 'plus' }), 'Add users to space']
    )
  ]);
}
