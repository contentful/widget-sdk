import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { TextInput, ModalConfirm, Paragraph } from '@contentful/forma-36-react-components';

import styles from '../styles.es6';

const RemoveOwnAdminMembershipConfirmation = ({
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
      <div className={styles.modalContent}>
        <Paragraph>
          You are about to remove the team {teamName} from this space. This will result in you{' '}
          {<strong className={styles.strong}>losing administrator role</strong>} for this space.
        </Paragraph>
        {isLastAdminMembership && (
          <Paragraph>
            If you remove this team, there will not be a user who can fully control this space. It
            will only be possibly to manage the space from your organization settings.
          </Paragraph>
        )}
        <Paragraph>
          To confirm you want to remove this team, please type
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

RemoveOwnAdminMembershipConfirmation.propTypes = {
  close: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isShown: PropTypes.bool.isRequired,
  teamName: PropTypes.string.isRequired,
  isLastAdminMembership: PropTypes.bool.isRequired
};

export default RemoveOwnAdminMembershipConfirmation;
