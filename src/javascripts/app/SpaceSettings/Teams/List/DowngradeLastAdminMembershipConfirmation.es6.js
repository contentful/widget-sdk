import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { TextInput, ModalConfirm, Paragraph } from '@contentful/forma-36-react-components';

import styles from '../styles.es6';

const DowngradeOwnAdminMembershipConfirmation = ({
  close,
  isShown,
  onConfirm,
  teamName,
  isLastAdminMembership
}) => {
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
      <div className={styles.modalContent}>
        <Paragraph>
          You are removing the admin role of the team{' '}
          {<strong className={styles.strong}>{teamName}</strong>}.{' '}
          {isLastAdminMembership &&
            'This team has a user with the last administrator role for this space.'}
        </Paragraph>
        {!isLastAdminMembership && (
          <Paragraph>
            If you change this role, you will lose your administrator role for this space and the
            team can only be managed by an organization admin.
          </Paragraph>
        )}
        {isLastAdminMembership && (
          <Paragraph>
            If you change this role, it can only be managed by an organization admin.
          </Paragraph>
        )}
        <Paragraph>
          To confirm you want to change this role, please type
          {<strong className={styles.strong}> &quot;I&nbsp;UNDERSTAND&quot; </strong>}
          in the field below:
        </Paragraph>
        <TextInput
          value={userConfirmationInput}
          onChange={({ target: { value } }) => setUserConfirmationInput(value)}
        />
      </div>
    </ModalConfirm>
  );
};

DowngradeOwnAdminMembershipConfirmation.propTypes = {
  close: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isShown: PropTypes.bool.isRequired,
  teamName: PropTypes.string.isRequired,
  isLastAdminMembership: PropTypes.bool.isRequired
};

export default DowngradeOwnAdminMembershipConfirmation;
