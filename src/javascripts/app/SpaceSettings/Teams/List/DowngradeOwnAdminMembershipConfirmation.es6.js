import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { TextInput, ModalConfirm } from '@contentful/forma-36-react-components';

import styles from '../styles.es6';

const DowngradeOwnAdminMembershipConfirmation = ({ close, isShown, onConfirm, teamName }) => {
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
      title="Change role of team for this space"
      intent="negative"
      confirmLabel="Change role"
      cancelLabel="Don't change role"
      isConfirmDisabled={userConfirmationInput !== 'I UNDERSTAND'}>
      <>
        <p>
          You are about to remove the admin role of the team {teamName}. This will result in you{' '}
          {<strong className={styles.strong}>losing administrator role</strong>} for this space.
        </p>
        <p>
          If you change this role, there might not be a user who can fully control this space. It
          will only be possibly to manage the space from your organization settings by an
          organization administrator.
        </p>
        <p>
          To confirm you want to change this role, please type
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

DowngradeOwnAdminMembershipConfirmation.propTypes = {
  close: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isShown: PropTypes.bool.isRequired,
  teamName: PropTypes.string.isRequired
};

export default DowngradeOwnAdminMembershipConfirmation;
