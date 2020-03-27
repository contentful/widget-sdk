import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Select,
  Option,
  TextInput,
  TextField,
  FormLabel,
  ValidationMessage,
} from '@contentful/forma-36-react-components';
import { toString } from 'lodash';
import styles from './styles';

const RegExpValidation = ({
  errorMessages,
  validation,
  updateValidationSettingsValue,
  updateValidationCurrentView,
  updateValidationMessageValue,
  validate,
}) => {
  const [message, setMessage] = useState(validation.message);
  const [currentView, setCurrentView] = useState(validation.currentView);
  const [pattern, setPattern] = useState(validation.settings.pattern);
  const [flags, setFlags] = useState(validation.settings.flags);
  const [fieldTouched, setFieldTouched] = useState(false);

  const updateCurrentView = (selectedViewName) => {
    const selectedView = validation.views.find((view) => selectedViewName === view.name);
    setCurrentView(selectedView.name);
    if (selectedView.pattern) {
      setPattern(selectedView.pattern);
    } else {
      setPattern('');
    }
  };

  const updatePattern = (updatedPattern) => {
    setFieldTouched(true);
    setPattern(updatedPattern);
    const updatedView =
      validation.views.find((view) => updatedPattern === view.pattern) || validation.views[0];
    setCurrentView(updatedView.name);
  };

  useEffect(() => {
    updateValidationMessageValue(message);
  }, [message, updateValidationMessageValue, validate]);

  useEffect(() => {
    updateValidationCurrentView(currentView);
  }, [currentView, updateValidationCurrentView, validate]);

  useEffect(() => {
    updateValidationSettingsValue({ pattern, flags });
    if (fieldTouched) {
      validate();
    }
  }, [pattern, flags, updateValidationSettingsValue, validate, fieldTouched]);

  return (
    <>
      <div className={styles.validationRow}>
        <Select
          name="Select condition"
          testId="select-condition"
          onChange={({ target: { value } }) => updateCurrentView(value)}
          value={currentView}
          width="medium">
          {validation.views.map(({ name, label }, index) => (
            <Option key={index} value={name}>
              {label}
            </Option>
          ))}
        </Select>
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

RegExpValidation.propTypes = {
  errorMessages: PropTypes.array.isRequired,
  validation: PropTypes.object.isRequired,
  updateValidationSettingsValue: PropTypes.func.isRequired,
  updateValidationCurrentView: PropTypes.func.isRequired,
  updateValidationMessageValue: PropTypes.func.isRequired,
  validate: PropTypes.func.isRequired,
};

export default RegExpValidation;
