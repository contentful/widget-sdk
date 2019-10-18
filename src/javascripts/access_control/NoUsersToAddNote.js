import React from 'react';
import PropTypes from 'prop-types';
import { TextLink } from '@contentful/forma-36-react-components';
import { goToUsers } from 'account/AccountUtils';

const NoUsersNote = ({ isOwnerOrAdmin }) => {
  return (
    <>
      There are no users in your organization who are not part of this space already.{' '}
      {isOwnerOrAdmin ? (
        <span>
          Go to <TextLink onClick={goToUsers}>{'organizations & billings'}</TextLink> to invite new
          users to your organization.
        </span>
      ) : (
        'Get in touch with an organization owner or admin to invite new users to your organization.'
      )}
    </>
  );
};

NoUsersNote.propTypes = {
  isOwnerOrAdmin: PropTypes.bool
};

export default NoUsersNote;
