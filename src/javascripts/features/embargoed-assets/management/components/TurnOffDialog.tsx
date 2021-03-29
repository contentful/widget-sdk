import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Modal,
  CheckboxField,
  Paragraph,
  Typography,
} from '@contentful/forma-36-react-components';
import { styles } from '../EmbargoedAssets.styles';
import { confirmLabelByLevel, LEVEL } from '../constants';

interface TurnOffDialogParams {
  onClose: () => void;
  onSubmit: () => void;
}

const TurnOffDialog = ({ onClose, onSubmit }: TurnOffDialogParams) => {
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const onCheckboxChange = () => setCheckboxChecked(!checkboxChecked);

  return (
    <Modal
      className={styles.dialogSmall}
      title="Turn off asset protection?"
      size="small"
      shouldCloseOnEscapePress
      shouldCloseOnOverlayClick
      isShown
      testId="turn-off-modal"
      onClose={onClose}>
      {({ title, onClose }) => (
        <>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content>
            <Typography>
              <Paragraph>
                All assets will become unprotected and accessible. You will no longer be able to
                create new asset signing keys, and existing signed URLs may cease functioning before
                their expiry.
              </Paragraph>
              <div>
                {' '}
                {/* wrapping in Paragraph is invalid, since a <div> shall not be nested in a <p> tag */}
                <CheckboxField
                  id="understand-change"
                  checked={checkboxChecked}
                  labelText={confirmLabelByLevel[LEVEL.DISABLED]}
                  onChange={onCheckboxChange}
                />
              </div>
              <div>
                <Button
                  buttonType="negative"
                  disabled={!checkboxChecked}
                  onClick={onSubmit}
                  className={styles.marginRight}>
                  Make all assets unprotected
                </Button>
                <Button buttonType="muted" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </Typography>
          </Modal.Content>
        </>
      )}
    </Modal>
  );
};

TurnOffDialog.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export { TurnOffDialog };
