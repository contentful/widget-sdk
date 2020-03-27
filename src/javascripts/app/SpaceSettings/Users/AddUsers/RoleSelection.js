import React, { useState } from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';
import {
  Modal,
  Button,
  Card,
  TextLink,
  Paragraph,
  Note,
  Icon
} from '@contentful/forma-36-react-components';
import {
  SpaceRole as SpaceRolePropType,
  OrganizationMembership as OrganizationMembershipPropType
} from 'app/OrganizationSettings/PropTypes';
import { css } from 'emotion';
import { get } from 'lodash';
import SpaceRoleEditor from 'app/OrganizationSettings/SpaceRoleEditor';
import UserCard from 'app/OrganizationSettings/Users/UserCard';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  description: css({
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingS
  }),
  userSelection: css({
    display: 'flex',
    flexDirection: 'column'
  }),
  list: css({
    maxHeight: 300,
    overflow: 'auto'
  }),
  user: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${tokens.spacingS} ${tokens.spacingM}`,
    '&:hover': {
      backgroundColor: tokens.colorElementLightest
    }
  }),
  roleSelector: css({
    display: 'flex',
    alignItems: 'center'
  }),
  errorMessage: css({
    margin: `${tokens.spacingS} 0 0`
  }),
  errorIcon: css({
    marginRight: tokens.spacingS
  })
};

export default function RoleSelection({
  selectedUsers,
  selectedRoles,
  spaceRoles,
  onChange,
  onClose,
  onBack,
  onConfirm
}) {
  const [invalidUsers, setInvalidUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // get count of users without roles assigned
    const invalid = selectedUsers.filter(
      orgMembership =>
        !selectedRoles[orgMembership.sys.id] || selectedRoles[orgMembership.sys.id].length === 0
    );

    setInvalidUsers(invalid);

    if (invalid.length === 0) {
      setLoading(true);
      onConfirm();
    }
  };

  const handleRoleChange = (orgMembership, roleIds) => {
    if (invalidUsers.includes(orgMembership)) {
      // remove from the list of invalid
      setInvalidUsers(invalidUsers.filter(membership => membership !== orgMembership));
    }
    onChange(orgMembership.sys.id, roleIds);
  };

  return (
    <>
      <Modal.Content className={styles.userSelection}>
        <Paragraph className={styles.description}>
          <strong>Assign roles to selected users</strong>
          <TextLink onClick={onBack}>Edit selection</TextLink>
        </Paragraph>

        <Card className={styles.list} padding="none">
          {selectedUsers.map(orgMembership => (
            <div
              key={orgMembership.sys.id}
              className={styles.user}
              data-test-id="add-users.role-selection.user-option">
              <UserCard user={orgMembership.sys.user} status={orgMembership.status} size="small" />
              <div className={styles.roleSelector}>
                {invalidUsers.includes(orgMembership) && (
                  <Icon icon="ErrorCircle" color="negative" className={styles.errorIcon} />
                )}
                <SpaceRoleEditor
                  options={spaceRoles}
                  value={get(selectedRoles, [orgMembership.sys.id], [])}
                  onChange={roleIds => handleRoleChange(orgMembership, roleIds)}
                />
              </div>
            </div>
          ))}
        </Card>

        {invalidUsers.length > 0 && (
          <Note
            testId="add-users.role-selection.error-note"
            noteType="negative"
            className={styles.errorMessage}>
            {`You are trying to add ${pluralize(
              'user',
              invalidUsers.length,
              true
            )} without a role. Please assign them a role before continuing.`}
          </Note>
        )}
      </Modal.Content>
      <Modal.Controls>
        <Button
          disabled={selectedUsers.length === 0}
          loading={loading}
          onClick={handleSubmit}
          buttonType="positive"
          testId="add-users.role-selection.submit-button">
          Add selected users
          {selectedUsers.length > 0 && ` (${selectedUsers.length})`}
        </Button>
        <Button
          buttonType="muted"
          disabled={loading}
          onClick={() => onClose(true)}
          testId="add-users.role-selection.cancel-button">
          Cancel
        </Button>
      </Modal.Controls>
    </>
  );
}

RoleSelection.propTypes = {
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  selectedUsers: PropTypes.arrayOf(OrganizationMembershipPropType).isRequired,
  spaceRoles: PropTypes.arrayOf(SpaceRolePropType),
  // object where the values are arrays of strings
  selectedRoles: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)).isRequired
};
