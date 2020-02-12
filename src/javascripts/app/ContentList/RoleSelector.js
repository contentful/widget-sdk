import { includes } from 'lodash';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';

import { createImmerReducer } from 'redux/utils/createImmerReducer';
import React, { useReducer, useEffect } from 'react';
import ModalLauncher from 'app/common/ModalLauncher';
import tokens from '@contentful/forma-36-tokens';
import {
  Notification,
  SkeletonContainer,
  SkeletonBodyText,
  Button,
  Paragraph,
  TextLink,
  Note,
  Modal
} from '@contentful/forma-36-react-components';
import { fetchAll } from 'data/CMA/FetchAll';

/**
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

export function openRoleSelector(spaceEndpoint, assignedRoles) {
  return ModalLauncher.open(({ onClose, isShown }) => (
    <Modal
      size="large"
      title="Share this view"
      isShown={isShown}
      onClose={() => {
        onClose(false);
      }}>
      <RoleSelectorContainer
        spaceEndpoint={spaceEndpoint}
        initialAssignedRoles={assignedRoles}
        onClose={onClose}
      />
    </Modal>
  ));
}

const styles = {
  selectAllWrapper: css({
    display: 'flex',
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingM
  }),
  buttonsWrapper: css({
    display: 'flex',
    marginTop: tokens.spacingL
  }),
  shareButton: css({
    marginRight: tokens.spacingM
  }),
  note: css({
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingM
  }),
  rolesContainer: css({
    // We want to show half of a role if the container scrolls
    maxHeight: '157px',
    position: 'relative',
    overflowX: 'hidden',
    overflowY: 'auto',
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingM
  }),
  role: css({
    display: 'flex',
    padding: `${tokens.spacingS} ${tokens.spacingM}`,
    userSelect: 'none',
    cursor: 'pointer'
  }),
  roleDisabled: css({
    cursor: 'not-allowed',
    color: tokens.colorTextLight
  }),
  roleSelected: css({
    backgroundColor: tokens.colorElementLightest
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

const reducer = createImmerReducer({
  SelectAll: state => {
    state.roles = state.roles.map(role => {
      if (role.disabled) {
        return role;
      }
      return {
        ...role,
        selected: true
      };
    });
  },
  UnselectAll: state => {
    state.roles = state.roles.map(role => {
      if (role.disabled) {
        return role;
      }
      return {
        ...role,
        selected: false
      };
    });
  },
  ToggleRoleSelection: (state, action) => {
    const { index } = action.payload;
    state.roles[index].selected = !state.roles[index].selected;
  },
  FetchSuccess: (state, action) => {
    const customRoles = action.payload.map(role => ({
      id: role.sys.id,
      name: role.name,
      disabled: false,
      selected: includes(state.initialAssignedRoles, role.sys.id)
    }));
    const roles = [
      {
        id: '__admin',
        name: 'Administrator (built-in)',
        disabled: true,
        selected: true
      },
      ...customRoles
    ];
    state.roles = roles;
    state.rolesFetchStatus = 'success';
  },
  FetchFailure: state => {
    state.rolesFetchStatus = 'failure';
  }
});

function RoleSelectorContainer({ spaceEndpoint, initialAssignedRoles, onClose }) {
  const [state, dispatch] = useReducer(reducer, {
    initialAssignedRoles: initialAssignedRoles || [],
    roles: null,
    rolesFetchStatus: 'pending'
  });

  useEffect(() => {
    fetchAll(spaceEndpoint, ['roles'], 100).then(
      data => {
        dispatch({ type: 'FetchSuccess', payload: data });
      },
      () => {
        dispatch({ type: 'FetchFailure' });
      }
    );
  }, [spaceEndpoint]);

  const actions = {
    CancelSelection: () => {
      onClose(false);
    },
    ConfirmSelection: () => {
      // Drop the builtin admin role
      const customRoles = state.roles.slice(1);
      const selectedIDs = customRoles.filter(r => r.selected).map(r => r.id);
      onClose(selectedIDs);
      Notification.success('View successfully shared');
    },
    ToggleRoleSelection: index => {
      dispatch({ type: 'ToggleRoleSelection', payload: { index } });
    },
    SelectAll: () => {
      dispatch({ type: 'SelectAll' });
    },
    UnselectAll: () => {
      dispatch({ type: 'UnselectAll' });
    }
  };

  return <RoleSelector state={state} actions={actions} />;
}

RoleSelectorContainer.propTypes = {
  spaceEndpoint: PropTypes.any,
  initialAssignedRoles: PropTypes.any,
  onClose: PropTypes.func.isRequired
};

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

function RoleSelector({ state, actions }) {
  return (
    <React.Fragment>
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
      <div className={styles.buttonsWrapper}>
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
    </React.Fragment>
  );
}

RoleSelector.propTypes = {
  actions: PropTypes.any,
  state: PropTypes.any
};

function renderRolesContainer(state, actions) {
  return (
    <React.Fragment>
      {state.rolesFetchStatus === 'pending' && (
        <SkeletonContainer clipId="roles-loading" ariaLabel="Loading roles...">
          <SkeletonBodyText numberOfLines={3} />
        </SkeletonContainer>
      )}
      {state.rolesFetchStatus === 'success' && (
        <RolesList roles={state.roles} toggleSelection={actions.ToggleRoleSelection} />
      )}
      {state.rolesFetchStatus === 'failure' && (
        <Note noteType="warning" className={styles.note}>
          There was an error while fetching the roles.
        </Note>
      )}
    </React.Fragment>
  );
}

function RolesList({ roles, toggleSelection }) {
  return (
    <div className={styles.rolesContainer}>
      {roles.map(({ id, name, selected, disabled }, i) => {
        return (
          <div
            key={`role-${id}`}
            className={[
              styles.role,
              selected ? styles.roleSelected : '',
              disabled ? styles.roleDisabled : ''
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
  );
}

RolesList.propTypes = {
  roles: PropTypes.array,
  toggleSelection: PropTypes.func.isRequired
};

function testId(id) {
  if (id) {
    id = '.' + id;
  }
  return 'view-roles-selector' + id;
}
