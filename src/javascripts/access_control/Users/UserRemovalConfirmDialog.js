import React from 'react';
import PropTypes from 'prop-types';
import { ModalConfirm, Paragraph } from '@contentful/forma-36-react-components';

const UserRemovalConfirmDialog = ({ displayName, isShown, onClose }) => (
  <ModalConfirm
    title={`Remove user ${displayName} from space`}
    intent="negative"
    confirmLabel="Remove"
    cancelLabel="Don't remove"
    isShown={isShown}
    onConfirm={() => onClose(true)}
    onCancel={() => onClose(false)}
    allowHeightOverflow={true}>
    <Paragraph>
      You are about to remove <em>{displayName}</em> from the space. After removal this user will
      not be able to access this space in any way. Do you want to proceed?
    </Paragraph>
  </ModalConfirm>
);
UserRemovalConfirmDialog.propTypes = {
  displayName: PropTypes.string.isRequired,
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default UserRemovalConfirmDialog;
