import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { TextInput, ModalConfirm } from '@contentful/forma-36-react-components';
import Highlight from './Highlight.es6';

const RemoveOwnAdminMembershipConfirmation = ({ close, isShown, onConfirm, teamName }) => {
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
      title="Remove team from this space"
      intent="negative"
      confirmLabel="Remove"
      cancelLabel="Don't remove"
      isConfirmDisabled={userConfirmationInput !== 'I UNDERSTAND'}>
      <>
        <p>
          You are about to remove the team {teamName} from this space. This will result in you{' '}
          {<Highlight>losing administrator role</Highlight>} for this space.
        </p>
        <p>
          If you remove this team, there might not be a user who can fully control this space. It
          will only be possibly to manage the space from your organization settings by an
          organization administrator.
        </p>
        <p>
          To confirm you want to remove this team, please type
          {<Highlight>&quot;I UNDERSTAND&quot;</Highlight>}
          in the field below:
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
  isShown: PropTypes.bool.isRequired,
  teamName: PropTypes.string.isRequired
};

export default RemoveOwnAdminMembershipConfirmation;
