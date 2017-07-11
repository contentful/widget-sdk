import {includes} from 'lodash';
import {h} from 'ui/Framework';
import {container, hfill, vspace_, vspace, hspace} from 'ui/Layout';
import {byName as Colors} from 'Styles/Colors';

import {open as openDialog} from 'modalDialog';

// TODO doc

export default function open (spaceEndpoint, selectedRoles) {
  return openDialog({
    template: '<cf-component-bridge class="modal-background" component="component">',
    controller: function ($scope) {
      createRoleSelector($scope, spaceEndpoint, selectedRoles);
    }
  }).promise;
}

function createRoleSelector ($scope, spaceEndpoint, selectedRoles) {
  const data = {
    cancelSelection: () => $scope.dialog.cancel(),
    confirmSelection: () => {
      const selectedRoles = data.roles
        .filter((role) => role.selected)
        .map((role) => role.id);
      $scope.dialog.confirm(selectedRoles);
    },
    roles: null,
    toggleRoleSelection: (index) => {
      data.roles[index].selected = !data.roles[index].selected;
      rerender();
    }
  };

  // TODO fetch all
  spaceEndpoint({
    method: 'GET',
    path: ['roles'],
    query: { limit: 100 }
  }).then((res) => {
    // TODO handle errors
    data.roles = res.items.map((role) => ({
      id: role.sys.id,
      name: role.name,
      selected: includes(selectedRoles, role.sys.id)
    }));
    rerender();
  });

  rerender();

  function rerender () {
    $scope.component = render(data);
    $scope.$applyAsync();
  }
}

function render ({
  roles,
  toggleRoleSelection,
  confirmSelection,
  cancelSelection
}) {
  return h('.modal-dialog', [
    h('header.modal-dialog__header', [
      h('h1', [
        'Select role'
      ]),
      h('button.modal-dialog__close', {
        onClick: () => cancelSelection()
      })
    ]),
    h('.modal-dialog__only-content', [
      renderRolesContainer({roles, toggleRoleSelection}),
      vspace(4),
      container({
        display: 'flex'
      }, [
        h('button.btn-primary-action', {
          onClick: confirmSelection
        }, [
          'Assign selected roles'
        ]),
        hspace('10px'),
        h('button.btn-secondary-action', {
          onClick: cancelSelection
        }, [
          'Cancel'
        ])
      ])
    ])
  ]);
}

function renderRolesContainer ({roles, toggleRoleSelection}) {
  return container({
    border: `1px solid ${Colors.iceDark}`,
    backgroundColor: Colors.elementLightest,
    height: '230px',
    position: 'relative'
  }, roles
      ? renderRoles({roles, toggleRoleSelection})
      : [ loader() ]
  );
}

function loader () {
  return h('.loading-box--stretched', [
    h('.loading-box__spinner')
  ]);
}
function renderRoles ({roles, toggleRoleSelection}) {
  return [
    vspace_('12.5px'),
    container({}, roles.map(({name, selected}, i) => {
      return h('div.__role-item', {
        role: 'button',
        onClick: () => toggleRoleSelection(i),

        style: {
          cursor: 'pointer',
          display: 'flex',
          padding: '12.5px 25px',
          backgroundColor: selected ? Colors.elementMid : ''
        }
      }, [
        name,
        hfill('20px'),
        container({
          fontFamily: 'FontAwesome',
          fontSize: '18px',
          color: selected ? Colors.greenDark : Colors.textLightest
        }, [
          selected ? '\uf058' : '\uf055'
        ])
      ]);
    })),
    vspace_('12.5px')
  ];
}
