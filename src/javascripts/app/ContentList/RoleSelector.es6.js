import { includes } from 'lodash';
import { unshift, assign, update, set } from 'utils/Collections.es6';
import * as K from 'utils/kefir.es6';
import { caseof } from 'sum-types';
import { makeCtor } from 'utils/TaggedValues.es6';

import React from 'react';
import { createStore, makeReducer } from 'ui/Framework/Store.es6';
import { byName as Colors } from 'Styles/Colors.es6';

import { Notification } from '@contentful/forma-36-react-components';
import { fetchAll } from 'data/CMA/FetchAll.es6';
import { getModule } from 'NgRegistry.es6';

const { open: openDialog } = getModule('modalDialog');

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

export default function open(spaceEndpoint, assignedRoles) {
  return openDialog({
    template: '<cf-component-store-bridge class="modal-background" component="component">',
    controller: function($scope) {
      // $scope.dialog is not defined when this is run but we want to
      // pass it to the role selector factory.
      const dialog = {
        confirm: value => $scope.dialog.confirm(value),
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

function createRoleSelector(dialog, spaceEndpoint, initialAssignedRoles) {
  const reduce = makeReducer({
    [CancelSelection](state) {
      dialog.cancel();
      return state;
    },
    [ConfirmSelection](state) {
      // Drop the builtin admin role
      const customRoles = state.roles.slice(1);
      const selectedIDs = customRoles.filter(r => r.selected).map(r => r.id);
      if (selectedIDs.length === customRoles.length) {
        dialog.confirm(undefined);
      } else {
        dialog.confirm(selectedIDs);
      }
      Notification.success('View successfully shared');
      return state;
    },

    [ToggleRoleSelection](state, index) {
      return update(state, ['roles', index, 'selected'], x => !x);
    },
    [SelectAll](state) {
      return setAllSelected(state, true);
    },
    [UnselectAll](state) {
      return setAllSelected(state, false);
    },

    [RespondFetch]: (state, status) => {
      return caseof(status, [
        [
          K.PromiseStatus.Resolved,
          ({ value }) => {
            const customRoles = value.map(role => ({
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
              roles,
              rolesFetchStatus: status
            });
          }
        ],
        [
          K.PromiseStatus.Rejected,
          () => {
            return assign(state, { rolesFetchStatus: status });
          }
        ]
      ]);
    }
  });

  const store = createStore(
    {
      roles: null,
      rolesFetchStatus: K.PromiseStatus.Pending()
    },
    reduce
  );

  const actions = {
    CancelSelection,
    ConfirmSelection,
    ToggleRoleSelection,
    SelectAll,
    UnselectAll
  };

  fetchAll(spaceEndpoint, ['roles'], 100).then(
    data => {
      store.dispatch(RespondFetch, K.PromiseStatus.Resolved(data));
    },
    err => {
      store.dispatch(RespondFetch, K.PromiseStatus.Rejected(err));
    }
  );

  return { store, render, actions };
}

// Updates the state so that all roles are either selected or
// unselected, excluding the admin role.
function setAllSelected(state, value) {
  return update(state, ['roles'], roles => {
    if (roles) {
      return roles.map(role => {
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

function selectAllButton(state, actions) {
  const disabled = !state.roles;
  const allSelected = (state.roles || []).every(role => role.selected);
  if (allSelected) {
    return (
      <button
        data-test-id={testId('unselect-all')}
        onClick={actions.UnselectAll}
        disabled={disabled}
        className="text-link f36-margin-left--m">
        Unselect all
      </button>
    );
  } else {
    return (
      <button
        data-test-id={testId('select-all')}
        onClick={actions.SelectAll}
        disabled={disabled}
        className="text-link f36-margin-left--m">
        Select all
      </button>
    );
  }
}

function render(state, actions) {
  return (
    <div data-test-id={testId()} style={{ maxWidth: '42em' }} className="modal-dialog">
      <header className="modal-dialog__header">
        <h1>Share this view</h1>
        <button onClick={actions.CancelSelection} className="modal-dialog__close" />
      </header>
      <div className="modal-dialog__only-content">
        <p style={{ lineHeight: '1.7' }}>{`A view displays a list of entries you searched for.
        By sharing this view with people with other roles,
        you are granting them access to view it.`}</p>
        <div className="f36-margin-top--l" />
        <div style={{ display: 'flex' }}>
          <strong key="select-roles">Select role(s)</strong>
          {selectAllButton(state, actions)}
        </div>
        <div className="f36-margin-top--l" />
        {renderRolesContainer(state, actions)}
        <div className="f36-margin-top--l" />
        <div className="note-box--info">
          <p>{`This view might display different content depending on the role,
          because different roles might have access to different content types.
          Administrators have access to all shared views.`}</p>
        </div>
        <div className="f36-margin-top--l" />
        <div style={{ display: 'flex' }}>
          <button
            key="share-this-view"
            data-test-id={testId('apply-selection')}
            onClick={actions.ConfirmSelection}
            className="btn-primary-action">
            Share this view
          </button>
          <button
            key="cancel"
            onClick={actions.CancelSelection}
            className="btn-secondary-action f36-margin-left--m">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function renderRolesContainer(state, actions) {
  return (
    <div
      style={{
        border: `1px solid ${Colors.iceDark}`,
        backgroundColor: Colors.elementLightest,
        // We want to show half of a role if the container scrolls
        maxHeight: '157px',
        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'auto'
      }}>
      {caseof(state.rolesFetchStatus, [
        [K.PromiseStatus.Pending, () => [loader()]],
        [K.PromiseStatus.Resolved, () => renderRoles(state.roles, actions.ToggleRoleSelection)],
        [K.PromiseStatus.Rejected, () => [fetchError()]]
      ])}
    </div>
  );
}

function fetchError() {
  return (
    <p
      style={{
        padding: '80px 25px',
        textAlign: 'center'
      }}>
      There was an error while fetching the roles.
    </p>
  );
}

function loader() {
  return (
    <div className="loading-box--stretched">
      <div className="loading-box__spinner" />
    </div>
  );
}

function renderRoles(roles, toggleSelection) {
  return (
    <React.Fragment>
      <div className="f36-margin-top--m" />
      <div>
        {roles.map(({ id, name, selected, disabled }, i) => {
          return (
            <div
              key={`role-${id}`}
              className={[
                'view-role-selector__role',
                selected ? 'x--selected' : '',
                disabled ? 'x--disabled' : ''
              ].join(' ')}
              data-test-id={testId(`roles.${id}`)}
              role="button"
              aria-disabled={String(!!disabled)}
              aria-checked={String(!!selected)}
              onClick={() => !disabled && toggleSelection(i)}>
              {name}
              <div
                style={{
                  marginLeft: 'auto',
                  marginRight: '20px'
                }}
              />
              <div
                style={{
                  fontFamily: 'FontAwesome',
                  fontSize: '18px',
                  color: selected ? Colors.greenDark : Colors.textLightest
                }}>
                {selected ? '\uf058' : '\uf055'}
              </div>
            </div>
          );
        })}
        <div className="f36-margin-top--m" />
      </div>
    </React.Fragment>
  );
}

function testId(id) {
  if (id) {
    id = '.' + id;
  }
  return 'view-roles-selector' + id;
}
