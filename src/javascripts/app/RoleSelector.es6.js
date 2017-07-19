import {includes, assign} from 'lodash';
import {h} from 'ui/Framework';
import {container, hfill, vspace_, vspace, hspace} from 'ui/Layout';
import {byName as Colors} from 'Styles/Colors';

import {open as openDialog} from 'modalDialog';

const MODE_EVERYBODY = 'everybody';
const MODE_ADMINS = 'admins';
const MODE_ROLES = 'roles';

// TODO doc

export default function open (spaceEndpoint, assignedRoles, labels = {}) {
  return openDialog({
    template: '<cf-component-bridge class="modal-background" component="component">',
    controller: function ($scope) {
      createRoleSelector($scope, spaceEndpoint, assignedRoles, labels);
    }
  }).promise;
}

function createRoleSelector ($scope, spaceEndpoint, assignedRoles, labels) {
  const data = {
    cancelSelection: () => $scope.dialog.cancel(),
    confirmSelection: () => {
      $scope.dialog.confirm({
        [MODE_EVERYBODY]: undefined,
        [MODE_ADMINS]: [],
        [MODE_ROLES]: getSelectedRoleIds(data.roles)
      }[data.mode]);
    },
    mode: determineInitialMode(assignedRoles),
    roles: null,
    toggleRoleSelection: (index) => {
      data.roles[index].selected = !data.roles[index].selected;
      rerender();
    },
    setMode: (mode) => {
      data.mode = mode;
      rerender();
    },
    labels: assign({title: 'Select role(s)', confirmation: 'OK'}, labels)
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
      selected: includes(assignedRoles, role.sys.id)
    }));
    rerender();
  });

  rerender();

  function rerender () {
    $scope.component = render(data);
    $scope.$applyAsync();
  }
}

function determineInitialMode (assignedRoles) {
  if (Array.isArray(assignedRoles)) {
    return assignedRoles.length > 0 ? MODE_ROLES : MODE_ADMINS;
  } else {
    return MODE_EVERYBODY;
  }
}

function getSelectedRoleIds (roles) {
  return (roles || []).filter(({selected}) => selected).map(({id}) => id);
}

function render ({
  roles,
  mode,
  toggleRoleSelection,
  setMode,
  confirmSelection,
  cancelSelection,
  labels
}) {
  return h('.modal-dialog', [
    h('header.modal-dialog__header', [
      h('h1', [
        labels.title
      ]),
      h('button.modal-dialog__close', {
        onClick: () => cancelSelection()
      })
    ]),
    h('.modal-dialog__only-content', [
      h('ul', [
        renderModeInput({label: 'Everybody', value: MODE_EVERYBODY, mode, setMode}),
        renderModeInput({label: 'Admins only', value: MODE_ADMINS, mode, setMode}),
        renderModeInput({label: 'Specific role(s)', value: MODE_ROLES, mode, setMode})
      ]),
      mode === MODE_ROLES && renderRolesContainer({roles, toggleRoleSelection}),
      vspace(4),
      container({
        display: 'flex'
      }, [
        h('button.btn-primary-action', {
          disabled: (mode === MODE_ROLES && getSelectedRoleIds(roles).length < 1)
            ? 'disabled'
            : '',
          onClick: confirmSelection
        }, [
          labels.confirmation
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

function renderModeInput ({label, value, mode, setMode}) {
  return h('li.cfnext-form-option', [
    h('label', [
      h('input', {
        name: 'mode',
        type: 'radio',
        checked: mode === value ? 'checked' : '',
        onClick: () => setMode(value)
      }),
      ` ${label}`
    ])
  ]);
}

function renderRolesContainer ({roles, toggleRoleSelection}) {
  return container({
    border: `1px solid ${Colors.iceDark}`,
    backgroundColor: Colors.elementLightest,
    height: '230px',
    position: 'relative',
    overflowX: 'scroll'
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
