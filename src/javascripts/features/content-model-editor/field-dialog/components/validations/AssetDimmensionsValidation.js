import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { TextField, ValidationMessage, CheckboxField } from '@contentful/forma-36-react-components';
import { styles } from './styles';
import { toString } from 'lodash';
import { ValidationFieldType } from 'features/content-model-editor/field-dialog/utils/PropTypes';
import { DimensionsParameters } from './DimensionsParametersComponent';

const AssetDimmensionsValidation = ({ validation, onChange, onBlur }) => {
  const { name, helpText, type, message, settings, enabled } = validation.value;

  const onSettingsChange = (settings) => {
    onChange(type, { ...validation.value, settings });
  };
  const onChangeMessage = (message) => onChange(type, { ...validation.value, message });

  const onWidthChange = (width) => onSettingsChange({ ...settings, width });
  const onHeightChange = (height) => onSettingsChange({ ...settings, height });

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
          <div className={styles.marginLeftL}>
            <DimensionsParameters
              type="width"
              settings={settings.width}
              setSettings={onWidthChange}
              onBlur={() => onBlur(type)}
            />
            <DimensionsParameters
              className={styles.marginTopS}
              type="height"
              settings={settings.height}
              setSettings={onHeightChange}
              onBlur={() => onBlur(type)}
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

AssetDimmensionsValidation.propTypes = {
  validation: PropTypes.shape(ValidationFieldType).isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
};

export { AssetDimmensionsValidation };
