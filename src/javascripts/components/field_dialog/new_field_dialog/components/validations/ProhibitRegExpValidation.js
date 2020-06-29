import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  TextInput,
  TextField,
  FormLabel,
  ValidationMessage,
  CheckboxField,
} from '@contentful/forma-36-react-components';
import { toString } from 'lodash';
import styles from './styles';
import { ValidationFieldType } from 'components/field_dialog/new_field_dialog/utils/PropTypes';

const ProhibitRegExpValidation = ({ fieldName, validation, onChange, onBlur }) => {
  const { name, helpText, type, message, settings, enabled } = validation.value;

  const onChangeFlags = (value) =>
    onChange(fieldName, { ...validation.value, settings: { ...settings, flags: value } });
  const onChangePattern = (value) =>
    onChange(fieldName, { ...validation.value, settings: { ...settings, pattern: value } });
  const onChangeMessage = (message) => onChange(fieldName, { ...validation.value, message });
  return (
    <div>
      <CheckboxField
        className={styles.marginBottomS}
        labelText={name}
        helpText={helpText}
        id={`field-validations--${type}`}
        checked={enabled}
        onChange={(e) =>
          onChange(type, {
            ...validation.value,
            enabled: e.target.checked,
          })
        }
      />
      {enabled && (
        <Fragment>
          <div className={styles.validationRow}>
            <TextInput
              name={`Regular expression pattern match`}
              testId="regexp-pattern-match"
              placeholder="foo|bar[baz]"
              value={toString(settings.pattern)}
              onChange={({ target: { value } }) => onChangePattern(value)}
              onBlur={() => onBlur(fieldName)}
              width="large"
            />
            <FormLabel className={styles.label} htmlFor="regexp-flags" testId="regexp-flags-label">
              Flags
            </FormLabel>
            <TextInput
              name={`Regular expression flags`}
              testId="regexp-flags"
              id="regexp-flags"
              value={toString(settings.flags)}
              onChange={({ target: { value } }) => onChangeFlags(value)}
              onBlur={() => onBlur(fieldName)}
              width="small"
            />
          </div>
          {validation.error && (
            <ValidationMessage className={styles.validationMessage}>
              {validation.error}
            </ValidationMessage>
          )}
          <TextField
            className={styles.helpTextInput}
            name="Custom error message"
            id="customErrorMessage"
            labelText="Custom error message"
            value={toString(message)}
            textInputProps={{ type: 'text' }}
            onChange={({ target: { value } }) => onChangeMessage(value)}
            onBlur={() => onBlur(fieldName)}
          />
        </Fragment>
      )}
    </div>
  );
};

ProhibitRegExpValidation.propTypes = {
  fieldName: PropTypes.string.isRequired,
  validation: PropTypes.shape(ValidationFieldType).isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
};

export default ProhibitRegExpValidation;