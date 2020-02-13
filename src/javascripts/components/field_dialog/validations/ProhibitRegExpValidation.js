import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  TextInput,
  TextField,
  FormLabel,
  ValidationMessage
} from '@contentful/forma-36-react-components';
import { toString } from 'lodash';
import styles from './styles';

const ProhibitRegExpValidation = ({
  errorMessages,
  validation,
  updateValidationSettingsValue,
  updateValidationMessageValue,
  validate
}) => {
  const [message, setMessage] = useState(validation.message);
  const [pattern, setPattern] = useState(validation.settings.pattern);
  const [flags, setFlags] = useState(validation.settings.flags);
  const [fieldTouched, setFieldTouched] = useState(false);

  const updatePattern = updatedPattern => {
    setFieldTouched(true);
    setPattern(updatedPattern);
  };

  useEffect(() => {
    updateValidationMessageValue(message);
  }, [message, updateValidationMessageValue, validate]);

  useEffect(() => {
    updateValidationSettingsValue({ pattern, flags });
    if (fieldTouched) {
      validate();
    }
  }, [pattern, flags, updateValidationSettingsValue, validate, fieldTouched]);

  return (
    <>
      <div className={styles.validationRow}>
        <TextInput
          name={`Regular expression pattern match`}
          testId="regexp-pattern-match"
          placeholder="foo|bar[baz]"
          value={toString(pattern)}
          onChange={({ target: { value } }) => updatePattern(value)}
          width="large"
        />
        <FormLabel className={styles.label} htmlFor="regexp-flags" testId="regexp-flags-label">
          Flags
        </FormLabel>
        <TextInput
          name={`Regular expression flags`}
          testId="regexp-flags"
          id="regexp-flags"
          value={toString(flags)}
          onChange={({ target: { value } }) => setFlags(value)}
          width="small"
        />
      </div>
      {errorMessages[0] && <ValidationMessage>{errorMessages[0]}</ValidationMessage>}
      <TextField
        className={styles.marginTopS}
        name="Custom error message"
        id="customErrorMessage"
        labelText="Custom error message"
        value={toString(message)}
        textInputProps={{ type: 'text' }}
        onChange={({ target: { value } }) => setMessage(value)}
      />
    </>
  );
};

ProhibitRegExpValidation.propTypes = {
  errorMessages: PropTypes.array.isRequired,
  validation: PropTypes.object.isRequired,
  updateValidationSettingsValue: PropTypes.func.isRequired,
  updateValidationMessageValue: PropTypes.func.isRequired,
  validate: PropTypes.func.isRequired
};

export default ProhibitRegExpValidation;
