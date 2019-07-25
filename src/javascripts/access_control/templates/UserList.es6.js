import { h, icons } from 'utils/legacy-html-hyperscript/index.es6';

export default function() {
  return h('div.workbench', [
    header(),
    h('.workbench-main', [
      h('.workbench-main__content', [
        h('react-component', {
          name: 'access_control/templates/UserListReact.es6',
          props: 'userListProps'
        })
      ]),
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

  return h('.workbench-header__wrapper', [
    h('header.workbench-header', [
      h('.workbench-header__icon.cf-icon', [icons.pageSettings]),
      h('h1.workbench-header__title', ['Users ({{ spaceUsersCount || 0 }})']),
      h('.workbench-header__actions', actions)
    ])
  ]);
}

function sidebar() {
  return h('.entity-sidebar', [
    h('h2.entity-sidebar__heading', ['Adding and managing users']),
    h(
      'button.btn-action.x--block',
      {
        ngClass: '{"is-loading": isInvitingUsersToSpace}',
        ngClick: 'openSpaceInvitationDialog()',
        ngDisabled: '!canModifyUsers()',
        dataTestId: 'add-users-to-space'
      },
      ['Add users']
    ),
    h('react-component', {
      name: 'access_control/templates/AddUsersToSpaceNote.es6',
      props: 'addUsersToSpaceNoteProps'
    })
  ]);
}
