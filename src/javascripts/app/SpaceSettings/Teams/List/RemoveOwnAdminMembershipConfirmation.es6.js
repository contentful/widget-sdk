import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { TextInput, ModalConfirm } from '@contentful/forma-36-react-components';

const RemoveOwnAdminMembershipConfirmation = ({ close, isShown, onConfirm }) => {
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
      title="Removing your own admin membership"
      intent="negative"
      confirmLabel="Confirm removal"
      cancelLabel="Keep admin privileges"
      isConfirmDisabled={userConfirmationInput !== 'I UNDERSTAND'}>
      <>
        <p>
          You are about to remove your space admin membership for this space. This can not be undone
          and there might be no space admin left who can fully control this space. In that case, you
          would need the help of an org admin to assign a new space admin.
        </p>
        <p>
          If you definitely want to remove this team, please type &quot;I UNDERSTAND&quot; in the
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

RemoveOwnAdminMembershipConfirmation.propTypes = {
  close: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isShown: PropTypes.bool.isRequired
};

export default RemoveOwnAdminMembershipConfirmation;
