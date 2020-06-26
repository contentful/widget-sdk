import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  FieldGroup,
  IconButton,
  Tooltip,
  ModalConfirm,
  Typography,
  Paragraph,
} from '@contentful/forma-36-react-components';
import { ModalLauncher } from 'core/components/ModalLauncher';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  fieldGroup: css({
    flexBasis: 0,
    position: 'relative',
    '.lock-button-container': css({
      position: 'absolute',
      top: '2.5rem',
      right: tokens.spacingS,
    }),
  }),
};

const onUnlock = async (setDisabled) => {
  const result = await ModalLauncher.open(({ isShown, onClose }) => (
    <ModalConfirm
      title="Warning! Changing a published field ID"
      confirmLabel="Unlock field for editing"
      intent="primary"
      isShown={isShown}
      onCancel={() => onClose(false)}
      onConfirm={() => onClose(true)}>
      <Typography>
        <Paragraph>
          Changing the ID of this field is immediate and will cause problems for any applications
          currently using it until those applications are updated.
        </Paragraph>
        <Paragraph>
          Your content will not show correctly until you update the field ID in your applications,
          too.
        </Paragraph>
      </Typography>
    </ModalConfirm>
  ));
  if (result) {
    setDisabled(false);
  }
};

const LockedField = ({
  value,
  onChange,
  onBlur,
  isDisabled,
  validationMessage,
  testId,
  // restProps contains
  // name, id, onBlur, required
  ...restProps
}) => {
  const [disabled, setDisabled] = useState(isDisabled);
  return (
    <FieldGroup testId={testId} row={true}>
      <div className={styles.fieldGroup}>
        <TextField
          value={value}
          onChange={({ target: { value } }) => onChange(value)}
          onBlur={onBlur}
          textInputProps={{
            disabled: disabled,
            type: 'text',
          }}
          validationMessage={validationMessage}
          {...restProps}
        />
        {disabled && (
          <div className="lock-button-container">
            <Tooltip content="Unlock published field">
              <IconButton
                testId="unlock-icon-button"
                iconProps={{
                  icon: 'Lock',
                }}
                label="Unlock published field"
                onClick={() => onUnlock(setDisabled)}
              />
            </Tooltip>
          </div>
        )}
      </div>
    </FieldGroup>
  );
};

LockedField.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  isDisabled: PropTypes.bool.isRequired,
  validationMessage: PropTypes.string.isRequired,
  testId: PropTypes.string.isRequired,
};

export default LockedField;
