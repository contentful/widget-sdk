import React from 'react';
import PropTypes from 'prop-types';
import { Heading, Button } from '@contentful/forma-36-react-components';

const DeleteUser = () => {
  return (
    <>
      <Heading>Danger Zone</Heading>
      <Button buttonType="negative">Delete User</Button>
    </>
  );
};

DeleteUser.propTypes = {
  userCancellationWarning: PropTypes.any
};

export default DeleteUser;
