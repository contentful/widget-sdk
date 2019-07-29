import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip, SectionHeading } from '@contentful/forma-36-react-components';
import pluralize from 'pluralize';

import ContextMenu from 'ui/Components/ContextMenu.es6';

const UserListReact = ({
  usersByView,
  selectedView,
  canModifyUsers,
  openRoleChangeDialog,
  openRemovalConfirmationDialog
}) => (
  <>
    {(usersByView[selectedView] || []).map(item => (
      <div key={item.label} className="user-list__group">
        <SectionHeading element="h3">{item.label}</SectionHeading>
        {item.users.map(user => (
          <div key={user.id} className="user-list__item">
            <img src={user.avatarUrl} width="50" height="50" />
            <div className="user-list__info">
              <strong className="user-list__name u-truncate">{user.name}</strong>
              {!user.confirmed && <small>This account is not confirmed</small>}
              <div className="user-list__roles">{user.roleNames}</div>
            </div>
            <Tooltip
              place="left"
              content={
                user.numberOfTeamMemberships > 0
                  ? `This user has space access through ${pluralize(
                      'team',
                      user.numberOfTeamMemberships,
                      true
                    )}`
                  : ''
              }>
              <ContextMenu
                buttonProps={{
                  className: 'btn-inline btn-actions-nav user-list__actions',
                  'data-test-id': 'user-list.actions'
                }}
                isDisabled={!canModifyUsers || user.numberOfTeamMemberships > 0}
                items={[
                  {
                    label: 'Change role',
                    action: () => openRoleChangeDialog(user),
                    otherProps: {
                      'data-ui-trigger': 'user-change-role'
                    }
                  },
                  {
                    label: 'Remove from this space',
                    action: () => openRemovalConfirmationDialog(user),
                    otherProps: {
                      'data-ui-trigger': 'user-remove-from-space'
                    }
                  }
                ]}
              />
            </Tooltip>
          </div>
        ))}
      </div>
    ))}
  </>
);

UserListReact.propTypes = {
  usersByView: PropTypes.objectOf(
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
  usersByView: {}
};

export default UserListReact;
