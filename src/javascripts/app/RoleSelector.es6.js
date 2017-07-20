import {includes} from 'lodash';
import {h} from 'ui/Framework';
import {container, hfill, vspace_, vspace, hspace} from 'ui/Layout';
import {byName as Colors} from 'Styles/Colors';
import {fetchAll} from 'data/CMA/FetchAll';

import {open as openDialog} from 'modalDialog';

const MODE_EVERYBODY = 'everybody';
const MODE_ADMINS = 'admins';
const MODE_ROLES = 'roles';

/**
 * @ngdoc service
 * @name app/RoleSelector
 * @description
 * Exports the role selection dialog for the saved views visibility setting.
 */

/**
 * @ngdoc method
 * @name app/RoleSelector#open
 * @description
 * Opens a dialog with three options:
 * - Everybody (maps to `undefined`)
 * - Admins only (maps to an empty array)
 * - Specific roles (maps to an array of strings representing role IDs)
 *
 * @param {spaceEndpoint}       spaceEndpoint  an instance created by
 *                                             data/Endpoint.createSpaceEndpoint
 * @param {undefined|string[]}  assignedRoles  currently assigned role IDs
 * @returns {Promise<undefined|string[]>}
 */

export default function open (spaceEndpoint, assignedRoles) {
  return openDialog({
    template: '<cf-component-bridge class="modal-background" component="component">',
    controller: function ($scope) {
      createRoleSelector($scope, spaceEndpoint, assignedRoles);
    }
  }).promise;
}

function createRoleSelector ($scope, spaceEndpoint, assignedRoles) {
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
    fetchError: null,
    toggleRoleSelection: (index) => {
      data.roles[index].selected = !data.roles[index].selected;
      rerender();
    },
    setMode: (mode) => {
      data.mode = mode;
      rerender();
    }
  };

  fetchAll(spaceEndpoint, ['roles'], 100)
  .then((roles) => {
    data.roles = roles.map((role) => ({
      id: role.sys.id,
      name: role.name,
      selected: includes(assignedRoles, role.sys.id)
    }));
    rerender();
  }, (err) => {
    data.fetchError = err;
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
  fetchError,
  mode,
  toggleRoleSelection,
  setMode,
  confirmSelection,
  cancelSelection
}) {
  return h('.modal-dialog', [
    h('header.modal-dialog__header', [
      h('h1', [
        'Select who can see this view'
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
      mode === MODE_ROLES && renderRolesContainer({roles, fetchError, toggleRoleSelection}),
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
          'Apply selection'
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
  const checked = mode === value;
  return h('li.cfnext-form-option', [
    h('label', [
      h('input', {
        name: 'mode',
        type: 'radio',
        checked: checked ? 'checked' : '',
        onClick: () => setMode(value),
        ref: el => el && checked && el.focus()
      }),
      ` ${label}`
    ])
  ]);
}

function renderRolesContainer (props) {
  return container({
    border: `1px solid ${Colors.iceDark}`,
    backgroundColor: Colors.elementLightest,
    height: '230px',
    position: 'relative',
    overflowX: 'scroll'
  }, renderRolesArea(props));
}

function renderRolesArea (props) {
  if (props.fetchError) {
    return [ fetchError() ];
  } else {
    return props.roles ? renderRoles(props) : [ loader() ];
  }
}

function fetchError () {
  return h('p', {
    style: {
      padding: '80px 25px',
      textAlign: 'center'
    }
  }, [
    'Couldn’t fetch your space roles. Please try again later'
  ]);
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
