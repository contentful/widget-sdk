import React from 'react';
import PropTypes from 'prop-types';
import { Note, TextLink } from '@contentful/forma-36-react-components';
import { goToUsers } from 'account/AccountUtils.es6';

const AddUsersNote = ({ isOwnerOrAdmin }) => {
  return (
    <Note>
      You can only add users to this space who are already part of your organization.
      {isOwnerOrAdmin ? (
        <span data-test-id="can-invite-users-to-organization">
          To invite new users to your organization, and ultimately this space, head to{' '}
          <TextLink onClick={goToUsers}>organizations</TextLink>.
        </span>
      ) : (
        <span data-test-id="cannot-invite-users-to-organization">
          Inviting new users to your organization can be done by an organization owner or admin.
        </span>
      )}
    </Note>
  );
};

AddUsersNote.propTypes = {
  isOwnerOrAdmin: PropTypes.bool
};

export default AddUsersNote;
