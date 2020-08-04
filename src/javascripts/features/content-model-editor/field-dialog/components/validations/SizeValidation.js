import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  Select,
  Option,
  TextInput,
  TextField,
  ValidationMessage,
  CheckboxField,
} from '@contentful/forma-36-react-components';
import { toString, isEmpty, toNumber } from 'lodash';
import { styles } from './styles';
import { ValidationFieldType } from 'features/content-model-editor/field-dialog/utils/PropTypes';

const SizeValidation = ({ fieldName, validation, onChange, onBlur }) => {
  // onBlur and onChange - useForm functions
  const { name, helpText, message, settings, views, currentView, enabled } = validation.value;
  //change settings reset on CurrentView change
  const onChangeCurrentView = (currentView) =>
    onChange(fieldName, { ...validation.value, currentView });
  const onChangeMessage = (message) => onChange(fieldName, { ...validation.value, message });
  const onChangeSettings = (settings) => onChange(fieldName, { ...validation.value, settings });

  //TODO: get nameKeyWord from content type field
  const nameKeyWord = 'size';

  const normalizeValue = (value) => (isEmpty(value) ? null : toNumber(value));

  const getControls = () => {
    switch (currentView) {
      case 'min':
        return (
          <TextInput
            name={`Minimum ${nameKeyWord}`}
            testId="min-size-input"
            className={styles.textInputNumber}
            placeholder="Min"
            type="number"
            value={toString(settings.min)}
            onChange={({ target: { value } }) => {
              onChangeSettings({ min: normalizeValue(value) });
            }}
            onBlur={() => onBlur(fieldName)}
            width="small"
          />
        );
      case 'max':
        return (
          <TextInput
            name={`Maximum ${nameKeyWord}`}
            testId="max-size-input"
            className={styles.textInputNumber}
            placeholder="Max"
            type="number"
            value={toString(settings.max)}
            onChange={({ target: { value } }) => {
              onChangeSettings({ max: normalizeValue(value) });
            }}
            onBlur={() => onBlur(fieldName)}
            width="small"
          />
        );
      case 'min-max':
        return (
          <Fragment>
            <TextInput
              name={`Minimum ${nameKeyWord}`}
              testId="min-size-input"
              className={styles.textInputNumber}
              placeholder="Min"
              type="number"
              value={toString(settings.min)}
              onChange={({ target: { value } }) => {
                onChangeSettings({ ...settings, min: normalizeValue(value) });
              }}
              onBlur={() => onBlur(fieldName)}
              width="small"
            />{' '}
            <div>and</div>
            <TextInput
              name={`Maximum ${nameKeyWord}`}
              testId="max-size-input"
              className={styles.textInputNumber}
              placeholder="Max"
              type="number"
              value={toString(settings.max)}
              onChange={({ target: { value } }) => {
                onChangeSettings({ ...settings, max: normalizeValue(value) });
              }}
              onBlur={() => onBlur(fieldName)}
              width="small"
            />
          </Fragment>
        );
      default:
        break;
    }
  };

  return (
    <div data-test-id={`field-validations--${fieldName}`}>
      <CheckboxField
        className={styles.marginBottomS}
        labelText={name}
        helpText={helpText}
        id={`field-validations-checkbox--${fieldName}`}
        checked={enabled}
        onChange={(e) =>
          onChange(fieldName, {
            ...validation.value,
            enabled: e.target.checked,
          })
        }
      />
      {enabled && (
        <Fragment>
          <div className={styles.validationRow}>
            <Select
              name="Select condition"
              testId="select-condition"
              onChange={({ target: { value } }) => onChangeCurrentView(value)}
              value={currentView}
              width="medium">
              {views.map(({ name, label }, index) => (
                <Option key={index} value={name}>
                  {label}
                </Option>
              ))}
            </Select>
            {getControls()}
          </div>
          {validation.error && (
            <ValidationMessage className={styles.validationMessage}>
              {validation.error}
            </ValidationMessage>
          )}
          <TextField
            className={styles.helpTextInput}
            name="Custom error message"
            id={
              validation.nodeType
                ? `custom-error-message-${validation.nodeType}-${fieldName}`
                : `custom-error-message-${fieldName}`
            }
            labelText="Custom error message"
            value={toString(message)}
            textInputProps={{ type: 'text' }}
            onChange={({ target: { value } }) => onChangeMessage(value)}
          />
        </Fragment>
      )}
    </div>
  );
};

SizeValidation.propTypes = {
  fieldName: PropTypes.string,
  validation: PropTypes.shape(ValidationFieldType).isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
};

export { SizeValidation };
