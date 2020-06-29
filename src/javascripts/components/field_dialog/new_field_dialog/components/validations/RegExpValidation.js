import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  Select,
  Option,
  TextInput,
  TextField,
  FormLabel,
  ValidationMessage,
  CheckboxField,
} from '@contentful/forma-36-react-components';
import { toString } from 'lodash';
import styles from './styles';
import { ValidationFieldType } from 'components/field_dialog/new_field_dialog/utils/PropTypes';

const RegExpValidation = ({ fieldName, validation, onChange, onBlur }) => {
  const { name, helpText, type, message, settings, views, currentView, enabled } = validation.value;

  const onChangeFlags = (value) =>
    onChange(fieldName, { ...validation.value, settings: { ...settings, flags: value } });
  const onChangeMessage = (message) => onChange(fieldName, { ...validation.value, message });
  const onChangeRegEx = ({ currentView, pattern }) => {
    onChange(fieldName, {
      ...validation.value,
      currentView,
      settings: { ...settings, pattern },
    });
  };

  const updateCurrentView = (selectedViewName) => {
    const selectedView = views.find((view) => selectedViewName === view.name);
    if (selectedView.pattern) {
      onChangeRegEx({ currentView: selectedView.name, pattern: selectedView.pattern });
    } else {
      onChangeRegEx({ currentView: selectedView.name, pattern: '' });
    }
  };

  const updatePattern = (updatedPattern) => {
    const updatedView = views.find((view) => updatedPattern === view.pattern) || views[0];
    onChangeRegEx({ currentView: updatedView.name, pattern: updatedPattern });
  };

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
            <Select
              name="Select condition"
              testId="select-condition"
              onChange={({ target: { value } }) => updateCurrentView(value)}
              value={currentView}
              width="medium">
              {views.map(({ name, label }, index) => (
                <Option key={index} value={name}>
                  {label}
                </Option>
              ))}
            </Select>
            <TextInput
              name={`Regular expression pattern match`}
              testId="regexp-pattern-match"
              placeholder="foo|bar[baz]"
              value={toString(settings.pattern)}
              onChange={({ target: { value } }) => updatePattern(value)}
              onBlur={() => onBlur(type)}
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
              onBlur={() => onBlur(type)}
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
            onBlur={() => onBlur(type)}
          />
        </Fragment>
      )}
    </div>
  );
};

RegExpValidation.propTypes = {
  fieldName: PropTypes.string.isRequired,
  validation: PropTypes.shape(ValidationFieldType).isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
};

export default RegExpValidation;
