/* eslint "rulesdir/restrict-inline-styles": "warn" */
import { includes } from 'lodash';
import { unshift, assign, update, set } from 'utils/Collections.es6';
import * as K from 'utils/kefir.es6';
import { caseof } from 'sum-types';
import { css, cx } from 'emotion';
import { makeCtor } from 'utils/TaggedValues.es6';

import React from 'react';
import { createStore, makeReducer } from 'ui/Framework/Store.es6';
import tokens from '@contentful/forma-36-tokens';
import {
  Notification,
  Heading,
  Button,
  Paragraph,
  TextLink,
  Note
} from '@contentful/forma-36-react-components';
import { fetchAll } from 'data/CMA/FetchAll.es6';
import { getModule } from 'NgRegistry.es6';

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
  const { open: openDialog } = getModule('modalDialog');
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

const styles = {
  modalDialog: css({
    maxWidth: '42em'
  }),
  selectAllWrapper: css({
    display: 'flex',
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingM
  }),
  shareButton: css({
    marginRight: tokens.spacingM
  }),
  note: css({
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingM
  }),
  rolesWrapper: css({
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingM
  }),
  errorNote: css({
    padding: '80px 25px',
    textAlign: 'center'
  }),
  rolesContainer: css({
    border: `1px solid ${tokens.colorIceDark}`,
    backgroundColor: tokens.colorElementLightest,
    // We want to show half of a role if the container scrolls
    maxHeight: '157px',
    position: 'relative',
    overflowX: 'hidden',
    overflowY: 'auto'
  }),
  viewWrapper: css({
    maxWidth: '42em'
  }),
  selectedWrapper: css({
    marginLeft: 'auto',
    marginRight: '20px'
  }),
  selectLink: css({
    marginLeft: tokens.spacingS
  }),
  selection: css({
    fontFamily: 'FontAwesome',
    fontSize: '18px',
    marginLeft: tokens.spacingXs,
    color: tokens.colorTextLightest
  }),
  selected: css({
    color: tokens.colorGreenDark
  })
};

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
      <TextLink
        data-test-id={testId('unselect-all')}
        onClick={actions.UnselectAll}
        disabled={disabled}
        className={cx(styles.selectLink)}>
        Unselect all
      </TextLink>
    );
  } else {
    return (
      <TextLink
        data-test-id={testId('select-all')}
        onClick={actions.SelectAll}
        disabled={disabled}
        className={cx(styles.selectLink)}>
        Select all
      </TextLink>
    );
  }
}

function render(state, actions) {
  return (
    <div
      data-test-id={testId()}
      className={cx(styles.modalDialog, styles.viewWrapper, 'modal-dialog')}>
      <header className="modal-dialog__header">
        <Heading>Share this view</Heading>
        <Button onClick={actions.CancelSelection} className="modal-dialog__close" />
      </header>
      <div className="modal-dialog__only-content">
        <Paragraph>
          A view displays a list of entries you searched for. By sharing this view with people with
          other roles, you are granting them access to view it.
        </Paragraph>
        <div className={styles.selectAllWrapper}>
          <strong key="select-roles">Select role(s)</strong>
          {selectAllButton(state, actions)}
        </div>
        {renderRolesContainer(state, actions)}
        <Note noteType="primary" className={styles.note}>
          This view might display different content depending on the role, because different roles
          might have access to different content types. Administrators have access to all shared
          views.
        </Note>
        <div className={styles.selectAllWrapper}>
          <Button
            className={styles.shareButton}
            key="share-this-view"
            testId={testId('apply-selection')}
            onClick={actions.ConfirmSelection}
            buttonType="positive">
            Share this view
          </Button>
          <Button key="cancel" buttonType="muted" onClick={actions.CancelSelection}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function renderRolesContainer(state, actions) {
  return (
    <div className={styles.rolesContainer}>
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
    <Paragraph className={styles.errorNote}>There was an error while fetching the roles.</Paragraph>
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
      <div className={styles.rolesWrapper}>
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
              <div className={styles.selectWrapper} />
              <div className={cx(styles.selection, selected && styles.selected)}>
                {selected ? '\uf058' : '\uf055'}
              </div>
            </div>
          );
        })}
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
