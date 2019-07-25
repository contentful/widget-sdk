import React from 'react';
import PropTypes from 'prop-types';

import ContextMenu from 'ui/Components/ContextMenu.es6';

const UserListReact = ({
  by,
  selectedView,
  canModifyUsers,
  openRoleChangeDialog,
  openRemovalConfirmationDialog
}) => (
  <>
    {(by[selectedView] || []).map(item => (
      <div key={item.label} className="user-list__group">
        <h3>{item.label}</h3>
        {item.users.map(user => (
          <div key={user.id} className="user-list__item">
            <img src={user.avatarUrl} width="50" height="50" />
            <div className="user-list__info">
              <strong className="user-list__name u-truncate">{user.name}</strong>
              {!user.confirmed && <small>This account is not confirmed</small>}
              <div className="user-list__roles">{user.roleNames}</div>
            </div>
            <ContextMenu
              isDisabled={!canModifyUsers || user.numberOfTeamMemberships > 0}
              items={[
                {
                  label: 'Change role',
                  action: () => openRoleChangeDialog(user)
                },
                {
                  label: 'Remove from this space',
                  action: () => openRemovalConfirmationDialog(user)
                }
              ]}
            />
          </div>
        ))}
      </div>
    ))}
  </>
);

UserListReact.propTypes = {
  by: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string
      })
    )
  ),
  selectedView: PropTypes.string.isRequired,
  canModifyUsers: PropTypes.bool.isRequired,
  openRoleChangeDialog: PropTypes.func.isRequired,
  openRemovalConfirmationDialog: PropTypes.func.isRequired
};

UserListReact.defaultProps = {
  by: {}
};

export default UserListReact;
