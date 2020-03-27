import React, { useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import { OrganizationMembership as OrganizationMembershipPropType } from 'app/OrganizationSettings/PropTypes';
import { Modal, TextField, Button } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import { flow, trim, deburr, lowerCase, get } from 'lodash';
import AvailableUsers from './AvailableUsers';
import { createImmerReducer } from 'redux/utils/createImmerReducer';

const styles = {
  userSelection: css({
    display: 'flex',
    flexDirection: 'column'
  })
};

const reducer = createImmerReducer({
  OPTIONS_CHANGED: (state, action) => {
    state.options = action.payload;
  },
  SEARCH_TERM_CHANGED: (state, action) => {
    state.searchTerm = action.payload;
  }
});

const initialState = {
  options: null,
  selectedUserIds: [],
  searchTerm: ''
};

export default function UserSelection({
  availableUsers,
  selectedUsers,
  onClose,
  onUserSelected,
  onUserRemoved,
  onConfirm
}) {
  const [{ options, searchTerm }, dispatch] = useReducer(reducer, initialState);

  const handleSearchUpdate = e => {
    const value = e.target.value;
    dispatch({ type: 'SEARCH_TERM_CHANGED', payload: value });
    const newOptions = filterUsers(value, availableUsers);
    dispatch({ type: 'OPTIONS_CHANGED', payload: newOptions });
  };

  useEffect(() => {
    availableUsers && dispatch({ type: 'OPTIONS_CHANGED', payload: availableUsers });
  }, [availableUsers]);

  return (
    <>
      <Modal.Content className={styles.userSelection}>
        <TextField
          id="userSearch"
          labelText="Select users"
          name="searchTerm"
          value={searchTerm}
          onChange={handleSearchUpdate}
          textInputProps={{
            placeholder: `Search users in your organization`,
            type: 'search',
            disabled: !availableUsers,
            autoFocus: true
          }}
        />
        <AvailableUsers
          orgMemberships={options}
          selectedUsers={selectedUsers}
          onUserSelected={onUserSelected}
          onUserRemoved={onUserRemoved}
        />
      </Modal.Content>
      <Modal.Controls>
        <Button
          disabled={selectedUsers.length === 0}
          onClick={() => onConfirm(selectedUsers)}
          buttonType="positive"
          testId="add-users.user-selection.submit-button">
          Assign roles to selected users
          {selectedUsers.length > 0 && ` (${selectedUsers.length})`}
        </Button>
        <Button
          buttonType="muted"
          onClick={() => onClose(true)}
          testId="add-users.user-selection.cancel-button">
          Cancel
        </Button>
      </Modal.Controls>
    </>
  );
}

UserSelection.propTypes = {
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onUserSelected: PropTypes.func.isRequired,
  onUserRemoved: PropTypes.func.isRequired,
  availableUsers: PropTypes.arrayOf(OrganizationMembershipPropType),
  selectedUsers: PropTypes.arrayOf(OrganizationMembershipPropType).isRequired
};

function filterUsers(searchTerm, list) {
  // "João " -> "joao"
  const sanitize = flow([trim, deburr, lowerCase]);
  const term = sanitize(searchTerm);

  return list.filter(option => {
    const attributes = [
      get(option, 'sys.user.firstName', '') + get(option, 'sys.user.lastName', ''),
      get(option, 'sys.user.email')
    ];
    // return memberships where the any of the attributes matches the search term
    return attributes.some(attr => sanitize(attr).includes(term));
  });
}
