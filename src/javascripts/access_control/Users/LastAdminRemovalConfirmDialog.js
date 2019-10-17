import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { ModalConfirm, Paragraph, TextInput } from '@contentful/forma-36-react-components';
import { css } from 'emotion';

const styles = {
  confirmationInput: css({
    marginTop: tokens.spacingS
  })
};

const LastAdminRemovalConfirmDialog = ({ displayName, isShown, onClose }) => {
  const [userConfirmationInput, setUserConfirmationInput] = useState('');

  useEffect(() => {
    !isShown && setUserConfirmationInput('');
  }, [isShown]);

  return (
    <ModalConfirm
      title={`Remove user ${displayName} from space`}
      intent="negative"
      confirmLabel="Remove"
      cancelLabel="Don't remove"
      isShown={isShown}
      onConfirm={() => onClose(true)}
      onCancel={() => onClose(false)}
      allowHeightOverflow={true}
      isConfirmDisabled={userConfirmationInput !== 'I UNDERSTAND'}>
      <Paragraph>
        You are about to remove <em>{displayName}</em> from the space.
        <em> {displayName}</em> is the last Administrator in this space. Please be aware that if you
        remove this user, there will be no one who can fully control the space. This, however, can
        be managed from your Organization settings.
      </Paragraph>
      <Paragraph>
        If you definitely want to delete this user, please type &quot;I UNDERSTAND&quot; in the
        field below:
      </Paragraph>
      <TextInput
        className={styles.confirmationInput}
        value={userConfirmationInput}
        onChange={({ target: { value } }) => setUserConfirmationInput(value)}
      />
    </ModalConfirm>
  );
};
LastAdminRemovalConfirmDialog.propTypes = {
  displayName: PropTypes.string.isRequired,
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default LastAdminRemovalConfirmDialog;
