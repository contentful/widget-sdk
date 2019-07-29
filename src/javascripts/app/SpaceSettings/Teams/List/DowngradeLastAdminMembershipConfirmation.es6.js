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
          You are about to remove the admin role of the team {teamName}. This will result in you{' '}
          {<strong className={styles.strong}>losing administrator role</strong>} for this space.
        </Paragraph>
        {isLastAdminMembership && (
          <Paragraph>
            If you change this role, there will not be a user who can fully control this space. It
            will only be possibly to manage the space from your organization settings.
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
