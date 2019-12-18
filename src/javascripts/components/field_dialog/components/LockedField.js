import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TextField, FieldGroup, IconButton, Tooltip } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  fieldGroup: css({
    flexBasis: 0,
    position: 'relative',
    '.lock-button-container': css({
      position: 'absolute',
      top: '2.5rem',
      right: tokens.spacingS
    })
  })
};

const LockedField = ({
  value,
  setValue,
  isDisabled,
  onUnlock,
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
          onChange={({ target: { value } }) => setValue(value)}
          textInputProps={{
            disabled: disabled,
            type: 'text'
          }}
          validationMessage={validationMessage}
          {...restProps}
        />
        {disabled && (
          <div className="lock-button-container">
            <Tooltip content="Unlock published field">
              <IconButton
                testId="unlock-icon-button"
                iconProps={{ icon: 'Lock' }}
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
  setValue: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool.isRequired,
  onUnlock: PropTypes.func.isRequired,
  validationMessage: PropTypes.string.isRequired,
  testId: PropTypes.string.isRequired
};

export default LockedField;
