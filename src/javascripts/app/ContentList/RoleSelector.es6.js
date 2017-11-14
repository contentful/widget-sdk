import {includes} from 'lodash';
import {unshift, assign, update, set} from 'utils/Collections';
import * as K from 'utils/kefir';
import {caseof} from 'libs/sum-types';
import {makeCtor} from 'utils/TaggedValues';

import {h} from 'ui/Framework';
import {createStore, makeReducer} from 'ui/Framework/Store';
import {container, hfill, vspace_, vspace, hspace} from 'ui/Layout';
import {byName as Colors} from 'Styles/Colors';

import Notification from 'notification';
import {fetchAll} from 'data/CMA/FetchAll';
import {open as openDialog} from 'modalDialog';


/**
 * @ngdoc service
 * @name app/ContentList/RoleSelector
 * @description
 * Exports the role selection dialog for the saved views visibility setting.
 */

/**
 * @ngdoc method
 * @name app/ContentList/RoleSelector#open
 * @description
 * Opens a dialog that allows the user to select which roles to display
 * a view for. Receives the inital list of role IDs and returns the new
 * list of role IDs or undefined if visible to everybody.
 *
 * @param {spaceEndpoint}       spaceEndpoint  an instance created by
 *                                             data/Endpoint.createSpaceEndpoint
 * @param {undefined|string[]}  assignedRoles  currently assigned role IDs
 * @returns {Promise<undefined|string[]>}
 */

export default function open (spaceEndpoint, assignedRoles) {
  return openDialog({
    template: '<cf-component-store-bridge class="modal-background" component="component">',
    controller: function ($scope) {
      // $scope.dialog is not defined when this is run but we want to
      // pass it to the role selector factory.
      const dialog = {
        confirm: (value) => $scope.dialog.confirm(value),
        cancel: () => $scope.dialog.cancel()
      };
      $scope.component = createRoleSelector(dialog, spaceEndpoint, assignedRoles);
    }
  }).promise;
}


const CancelSelection = makeCtor('CancelSelection');
const ConfirmSelection = makeCtor('ConfirmSelection');
const ToggleRoleSelection = makeCtor('ToggleRoleSelection');
const SelectAll = makeCtor('SelectAll');
const UnselectAll = makeCtor('UnselectAll');

// Emitted with the PromiseStatus response of the role fetch
const RespondFetch = makeCtor('RespondFetch');


function createRoleSelector (dialog, spaceEndpoint, initialAssignedRoles) {
  const reduce = makeReducer({
    [CancelSelection] (state) {
      dialog.cancel();
      return state;
    },
    [ConfirmSelection] (state) {
      // Drop the builtin admin role
      const customRoles = state.roles.slice(1);
      const selectedIDs = customRoles.filter((r) => r.selected).map((r) => r.id);
      if (selectedIDs.length === customRoles.length) {
        dialog.confirm(undefined);
      } else {
        dialog.confirm(selectedIDs);
      }
      Notification.info('View successfully shared');
      return state;
    },

    [ToggleRoleSelection] (state, index) {
      return update(state, ['roles', index, 'selected'], (x) => !x);
    },
    [SelectAll] (state) {
      return setAllSelected(state, true);
    },
    [UnselectAll] (state) {
      return setAllSelected(state, false);
    },

    [RespondFetch]: (state, status) => {
      return caseof(status, [
        [K.PromiseStatus.Resolved, ({value}) => {
          const customRoles = value.map((role) => ({
            id: role.sys.id,
            name: role.name,
            disabled: false,
            selected: !initialAssignedRoles || includes(initialAssignedRoles, role.sys.id)
          }));
          const roles = unshift(customRoles, {
            id: '__admin',
            name: 'Administrator (built-in)',
            disabled: true,
            selected: true
          });
          return assign(state, {
            roles: roles,
            rolesFetchStatus: status
          });
        }],
        [K.PromiseStatus.Rejected, () => {
          return assign(state, { rolesFetchStatus: status });
        }]
      ]);
    }
  });

  const store = createStore({
    roles: null,
    rolesFetchStatus: K.PromiseStatus.Pending()
  }, reduce);

  const actions = {
    CancelSelection,
    ConfirmSelection,
    ToggleRoleSelection,
    SelectAll,
    UnselectAll
  };

  fetchAll(spaceEndpoint, ['roles'], 100)
  .then((data) => {
    store.dispatch(RespondFetch, K.PromiseStatus.Resolved(data));
  }, (err) => {
    store.dispatch(RespondFetch, K.PromiseStatus.Rejected(err));
  });

  return { store, render, actions };
}


// Updates the state so that all roles are either selected or
// unselected, excluding the admin role.
function setAllSelected (state, value) {
  return update(state, ['roles'], (roles) => {
    if (roles) {
      return roles.map((role) => {
        if (role.disabled) {
          // Ignore admin role
          return role;
        } else {
          return set(role, 'selected', value);
        }
      });
    }
  });
}


function selectAllButton (state, actions) {
  const disabled = !state.roles;
  const allSelected = (state.roles || []).every((role) => role.selected);
  if (allSelected) {
    return h('button.text-link', {
      dataTestId: testId('unselect-all'),
      onClick: () => actions.UnselectAll(),
      disabled: disabled
    }, [
      'Unselect all'
    ]);
  } else {
    return h('button.text-link', {
      dataTestId: testId('select-all'),
      onClick: () => actions.SelectAll(),
      disabled: disabled
    }, [
      'Select all'
    ]);
  }
}


function render (state, actions) {
  return h('.modal-dialog', {
    dataTestId: testId(),
    style: { maxWidth: '42em' }
  }, [
    h('header.modal-dialog__header', [
      h('h1', [
        'Share this view'
      ]),
      h('button.modal-dialog__close', {
        onClick: () => actions.CancelSelection()
      })
    ]),
    h('.modal-dialog__only-content', [
      h('p', { style: { lineHeight: '1.7' } }, [
        `A view displays a list of entries you searched for.
        By sharing this view with people with other roles,
        you are granting them access to view it.`
      ]),
      vspace(4),
      container({
        display: 'flex'
      }, [
        hfill(),
        selectAllButton(state, actions)
      ]),
      vspace(4),
      renderRolesContainer(state, actions),
      vspace(4),
      h('.note-box--info', [
        h('p', [
          `This view might display different content depending on the role,
          because different roles might have access to different content types.
          Administrators have access to all views.`
        ])
      ]),
      vspace(4),
      container({
        display: 'flex'
      }, [
        h('button.btn-primary-action', {
          dataTestId: testId('apply-selection'),
          onClick: () => actions.ConfirmSelection()
        }, [
          'Share this view'
        ]),
        hspace('10px'),
        h('button.btn-secondary-action', {
          onClick: () => actions.CancelSelection()
        }, [
          'Cancel'
        ])
      ])
    ])
  ]);
}


function renderRolesContainer (state, actions) {
  return container({
    border: `1px solid ${Colors.iceDark}`,
    backgroundColor: Colors.elementLightest,
    // We want to show half of a role if the container scrolls
    maxHeight: '157px',
    position: 'relative',
    overflowX: 'hidden',
    overflowY: 'auto'
  }, caseof(state.rolesFetchStatus, [
    [K.PromiseStatus.Pending, () => [ loader() ]],
    [K.PromiseStatus.Resolved, () => renderRoles(state.roles, actions.ToggleRoleSelection)],
    [K.PromiseStatus.Rejected, () => [ fetchError() ]]
  ]));
}


function fetchError () {
  return h('p', {
    style: {
      padding: '80px 25px',
      textAlign: 'center'
    }
  }, [
    'There was an error while fetching the roles.'
  ]);
}


function loader () {
  return h('.loading-box--stretched', [
    h('.loading-box__spinner')
  ]);
}


function renderRoles (roles, toggleSelection) {
  return [
    vspace_('12.5px'),
    container({}, roles.map(({id, name, selected, disabled}, i) => {
      return h('div', {
        class: [
          'view-role-selector__role',
          selected ? 'x--selected' : '',
          disabled ? 'x--disabled' : ''
        ].join(' '),
        dataTestId: testId(`roles.${id}`),
        role: 'button',
        ariaDisabled: String(!!disabled),
        ariaChecked: String(!!selected),
        onClick: () => !disabled && toggleSelection(i)
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

function testId (id) {
  if (id) {
    id = '.' + id;
  }
  return 'view-roles-selector' + id;
}
