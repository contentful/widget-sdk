import React from 'react';
import PropTypes from 'prop-types';

import { ModalConfirm } from '@contentful/forma-36-react-components';
import { styles } from './styles';

const ValidateReleaseDialog = ({ onConfirm, onCancel, isShown }) => {
  return (
    <ModalConfirm
      isShown={isShown}
      testId="validate-release-confirmation-dialog"
      intent="negative"
      title="Validate release?"
      onConfirm={onConfirm}
      confirmLabel="Validate now"
      confirmTestId="confirm"
      cancelLabel="Not now"
      onCancel={onCancel}
      cancelTestId="cancel">
      <div>
        Do you want to check the content of your release to make sure it passes all content
        validations? This may take a minute.
      </div>
      <div className={styles.validateReleaseDialogText}>
        If you are continuing to make changes to your content, we recommend running a validation
        check once you are done, otherwise your release may not publish.
      </div>
    </ModalConfirm>
  );
};

ValidateReleaseDialog.propTypes = {
  isShown: PropTypes.bool,
  onCancel: PropTypes.func,
  onConfirm: PropTypes.func,
};

export default ValidateReleaseDialog;
