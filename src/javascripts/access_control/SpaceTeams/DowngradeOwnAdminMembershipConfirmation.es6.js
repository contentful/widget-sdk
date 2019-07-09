import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { TextInput, ModalConfirm } from '@contentful/forma-36-react-components';

const DowngradeOwnAdminMembershipConfirmation = ({ close, isShown, onConfirm }) => {
  const [userConfirmationInput, setUserConfirmationInput] = useState('');

  useEffect(() => {
    !isShown && setUserConfirmationInput('');
  }, [isShown]);

  return (
    <ModalConfirm
      onCancel={close}
      onClose={close}
      onConfirm={onConfirm}
      isShown={isShown}
      title="Removing your own admin privileges"
      intent="negative"
      confirmLabel="Confirm update"
      cancelLabel="Keep admin privileges"
      isConfirmDisabled={userConfirmationInput !== 'I UNDERSTAND'}>
      <>
        <p>
          You are about to remove your own admin privileges for this space. This can not be undone
          and there might be no one left who can fully control the space. In this case, you will
          need the help of an org admin to assign a new space admin.
        </p>
        <p>
          If you definitely want to delete this user, please type &quot;I UNDERSTAND&quot; in the
          field below:
        </p>
        <TextInput
          value={userConfirmationInput}
          onChange={({ target: { value } }) => setUserConfirmationInput(value)}
        />
      </>
    </ModalConfirm>
  );
};

DowngradeOwnAdminMembershipConfirmation.propTypes = {
  close: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isShown: PropTypes.bool.isRequired
};

export default DowngradeOwnAdminMembershipConfirmation;
