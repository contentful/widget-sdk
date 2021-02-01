import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  Select,
  Option,
  TextField,
  ValidationMessage,
  CheckboxField,
  Flex,
} from '@contentful/forma-36-react-components';
import { styles } from './styles';
import { toString } from 'lodash';
import { FileSizeComponent } from './FileSizeComponent';
import { ValidationFieldType } from 'features/content-model-editor/field-dialog/utils/PropTypes';
import { rangeTypes } from 'features/content-model-editor/field-dialog/utils/helpers';

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
            value={settings?.min}
            onUpdate={(min) => onSettingsChange({ ...settings, min })}
            onBlur={() => onBlur(type)}
          />
        );
      case rangeTypes.MAX:
        return (
          <FileSizeComponent
            type={rangeTypes.MAX}
            value={settings?.max}
            onUpdate={(max) => onSettingsChange({ ...settings, max })}
            onBlur={() => onBlur(type)}
          />
        );
      case rangeTypes.MIN_MAX:
        return (
          <Flex flexDirection="row" alignItems="center">
            <Flex marginRight="spacingS">
              <FileSizeComponent
                type={rangeTypes.MIN}
                value={settings?.min}
                onUpdate={(min) => onSettingsChange({ ...settings, min })}
                onBlur={() => onBlur(type)}
              />
            </Flex>
            <Flex marginRight="spacingS">and</Flex>
            <FileSizeComponent
              type={rangeTypes.MAX}
              value={settings?.max}
              onUpdate={(max) => onSettingsChange({ ...settings, max })}
              onBlur={() => onBlur(type)}
            />
          </Flex>
        );
      default:
        break;
    }
  };
  return (
    <div data-test-id={`field-validations--${type}`}>
      <CheckboxField
        className={styles.marginBottomS}
        labelText={name}
        helpText={helpText}
        id={`field-validations-checkbox--${type}`}
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
          <Flex className={styles.validationRow} flexDirection="column">
            <Flex marginBottom="spacingM">
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
            </Flex>
            {getControls(currentView)}
          </Flex>
          {validation.error && (
            <ValidationMessage className={styles.validationMessage}>
              {validation.error}
            </ValidationMessage>
          )}
          <TextField
            className={styles.helpTextInput}
            name="Custom error message"
            id={`custom-error-message-${type}`}
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

export { AssetFileSizeValidation };
