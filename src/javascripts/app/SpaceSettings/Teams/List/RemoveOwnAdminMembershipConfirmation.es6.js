import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { TextInput, ModalConfirm } from '@contentful/forma-36-react-components';

import styles from '../styles.es6';

const RemoveOwnAdminMembershipConfirmation = ({ close, isShown, onConfirm, teamName }) => {
  const [userConfirmationInput, setUserConfirmationInput] = useState('');

  useEffect(() => {
    !isShown && setUserConfirmationInput('');
  }, [isShown]);

  return (
    <ModalConfirm
      testId="remove-own-admin-confirmation"
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
          {<strong className={styles.strong}>losing administrator role</strong>} for this space.
        </p>
        <p>
          If you remove this team, there might not be a user who can fully control this space. It
          will only be possibly to manage the space from your organization settings by an
          organization administrator.
        </p>
        <p>
          To confirm you want to remove this team, please type
          {<strong className={styles.strong}> &quot;I&nbsp;UNDERSTAND&quot; </strong>}
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
