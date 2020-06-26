import React from 'react';
import PropTypes from 'prop-types';

import { ModalConfirm } from '@contentful/forma-36-react-components';

const DeleteReleaseConfirmationDialog = ({ onConfirm, onCancel, isShown }) => {
  return (
    <ModalConfirm
      isShown={isShown}
      testId="delete-release-confirmation-dialog"
      intent="negative"
      title="Delete this release"
      onConfirm={onConfirm}
      confirmLabel="Delete release"
      confirmTestId="confirm"
      cancelLabel="Nevermind"
      onCancel={onCancel}
      cancelTestId="cancel">
      Proceeding will delete the release itself, but not the content it contains. Your content will
      remain untouched.
    </ModalConfirm>
  );
};

DeleteReleaseConfirmationDialog.propTypes = {
  isShown: PropTypes.bool,
  onCancel: PropTypes.func,
  onConfirm: PropTypes.func,
};

export default DeleteReleaseConfirmationDialog;
