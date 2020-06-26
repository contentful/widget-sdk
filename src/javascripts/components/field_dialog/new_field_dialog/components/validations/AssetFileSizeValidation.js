import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  Select,
  Option,
  TextField,
  ValidationMessage,
  CheckboxField,
} from '@contentful/forma-36-react-components';
import styles from './styles';
import { toString } from 'lodash';
import FileSizeComponent from 'components/field_dialog/validations/components/FileSizeComponent';
import { ValidationFieldType } from 'components/field_dialog/new_field_dialog/utils/PropTypes';
import { rangeTypes } from 'components/field_dialog/new_field_dialog/utils/helpers';

const AssetFileSizeValidation = ({ validation, onChange, onBlur }) => {
  const { name, helpText, type, message, settings, views, currentView, enabled } = validation.value;

  const onSettingsChange = (settings) => onChange(type, { ...validation.value, settings });
  const onChangeCurrentView = (currentView) => onChange(type, { ...validation.value, currentView });
  const onChangeMessage = (message) => onChange(type, { ...validation.value, message });

  const getControls = (currentView) => {
    switch (currentView) {
      case rangeTypes.MIN:
        return (
          <FileSizeComponent
            type={rangeTypes.MIN}
            value={settings.min}
            onUpdate={(min) => onSettingsChange({ ...settings, min })}
            onBlur={() => onBlur(type)}
          />
        );
      case rangeTypes.MAX:
        return (
          <FileSizeComponent
            type={rangeTypes.MAX}
            value={settings.max}
            onUpdate={(max) => onSettingsChange({ ...settings, max })}
            onBlur={() => onBlur(type)}
          />
        );
      case rangeTypes.MIN_MAX:
        return (
          <Fragment>
            <FileSizeComponent
              type={rangeTypes.MIN}
              value={settings.min}
              onUpdate={(min) => onSettingsChange({ ...settings, min })}
              onBlur={() => onBlur(type)}
            />
            <div>and</div>
            <FileSizeComponent
              type={rangeTypes.MAX}
              value={settings.max}
              onUpdate={(max) => onSettingsChange({ ...settings, max })}
              onBlur={() => onBlur(type)}
            />
          </Fragment>
        );
      default:
        break;
    }
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
        inputProps={{
          onBlur: () => {},
        }}
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
            {getControls(currentView)}
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
          />
        </Fragment>
      )}
    </div>
  );
};

AssetFileSizeValidation.propTypes = {
  validation: PropTypes.shape(ValidationFieldType).isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
};

export default AssetFileSizeValidation;
