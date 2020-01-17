import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Select,
  Option,
  TextInput,
  TextField,
  ValidationMessage
} from '@contentful/forma-36-react-components';
import { toNumber, toString, isEmpty } from 'lodash';
import styles from './styles';

const SizeValidation = ({
  validation,
  updateValidationSettingsValue,
  updateValidationCurrentView,
  updateValidationMessageValue,
  errorMessages,
  validate
}) => {
  const [currentView, setCurrentView] = useState(validation.currentView);
  const [message, setMessage] = useState(validation.message);
  const [settings, setSettings] = useState(validation.settings);
  const [fieldTouched, setFieldTouched] = useState(false);

  useEffect(() => {
    updateValidationSettingsValue(settings);
    updateValidationCurrentView(currentView);
    updateValidationMessageValue(message);
    if (fieldTouched) {
      validate();
    }
  }, [currentView, fieldTouched, message, settings, updateValidationCurrentView, updateValidationMessageValue, updateValidationSettingsValue, validate]);

  const normalizeValue = value => (isEmpty(value) ? null : toNumber(value));

  const getControls = () => {
    switch (currentView) {
      case 'min':
        return (
          <TextInput
            name="Minimum size"
            testId="min-size-input"
            className={styles.textInputNumber}
            placeholder="Min"
            type="number"
            value={toString(settings.min)}
            onChange={({ target: { value } }) => {
              setSettings({ min: normalizeValue(value) });
              setFieldTouched(true);
            }}
            width="small"
          />
        );
      case 'max':
        return (
          <TextInput
            name="Maximum size"
            testId="max-size-input"
            className={styles.textInputNumber}
            placeholder="Max"
            type="number"
            value={toString(settings.max)}
            onChange={({ target: { value } }) => {
              setSettings({ max: normalizeValue(value) });
              setFieldTouched(true);
            }}
            width="small"
          />
        );
      case 'min-max':
        return (
          <>
            <TextInput
              name="Minimum size"
              testId="min-size-input"
              className={styles.textInputNumber}
              placeholder="Min"
              type="number"
              value={toString(settings.min)}
              onChange={({ target: { value } }) => {
                setSettings({ ...settings, min: normalizeValue(value) });
                setFieldTouched(true);
              }}
              width="small"
            />{' '}
            <div>and</div>
            <TextInput
              name="Maximum size"
              testId="max-size-input"
              className={styles.textInputNumber}
              placeholder="Max"
              type="number"
              value={toString(settings.max)}
              onChange={({ target: { value } }) => {
                setSettings({ ...settings, max: normalizeValue(value) });
                setFieldTouched(true);
              }}
              width="small"
            />
          </>
        );
      default:
        break;
    }
  };

  return (
    <>
      <div className={styles.validationRow}>
        <Select
          name="Select condition"
          testId="select-condition"
          onChange={({ target: { value } }) => setCurrentView(value)}
          value={currentView}
          width="medium">
          {validation.views.map(({ name, label }, index) => (
            <Option key={index} value={name}>
              {label}
            </Option>
          ))}
        </Select>
        {getControls()}
      </div>
      {errorMessages[0] && <ValidationMessage>{errorMessages[0]}</ValidationMessage>}
      <TextField
        className={styles.errorMessage}
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

SizeValidation.propTypes = {
  validation: PropTypes.object.isRequired,
  updateValidationSettingsValue: PropTypes.func.isRequired,
  updateValidationCurrentView: PropTypes.func.isRequired,
  updateValidationMessageValue: PropTypes.func.isRequired,
  errorMessages: PropTypes.arrayOf(PropTypes.string).isRequired,
  validate: PropTypes.func.isRequired
};

export default SizeValidation;
