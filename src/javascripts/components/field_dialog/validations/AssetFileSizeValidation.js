import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Select,
  Option,
  TextField,
  ValidationMessage,
} from '@contentful/forma-36-react-components';
import styles from './styles';
import { toString } from 'lodash';
import FileSizeComponent from './components/FileSizeComponent';

const AssetFileSizeValidation = ({
  errorMessages,
  validation,
  updateValidationSettingsValue,
  updateValidationCurrentView,
  updateValidationMessageValue,
}) => {
  const [currentView, setCurrentView] = useState(validation.currentView);
  const [message, setMessage] = useState(validation.message);
  const [min, setMin] = useState(validation.settings.min);
  const [max, setMax] = useState(validation.settings.max);

  useEffect(() => {
    updateValidationSettingsValue({ min, max });
  }, [min, max, updateValidationSettingsValue]);

  useEffect(() => {
    updateValidationCurrentView(currentView);
  }, [currentView, updateValidationCurrentView]);

  useEffect(() => {
    updateValidationMessageValue(message);
  }, [message, updateValidationMessageValue]);

  const resetView = (currentView) => {
    // TODO: remove after migrating content type settings dialog to React
    setMin(null);
    setMax(null);
    setCurrentView(currentView);
  };

  const getControls = () => {
    switch (currentView) {
      case 'min':
        return <FileSizeComponent type="min" value={min} onUpdate={setMin} />;
      case 'max':
        return <FileSizeComponent type="max" value={max} onUpdate={setMax} />;
      case 'min-max':
        return (
          <>
            <FileSizeComponent type="min" value={min} onUpdate={setMin} />
            <div>and</div>
            <FileSizeComponent type="max" value={max} onUpdate={setMax} />
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
          onChange={({ target: { value } }) => resetView(value)}
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

AssetFileSizeValidation.propTypes = {
  errorMessages: PropTypes.array.isRequired,
  validation: PropTypes.object.isRequired,
  updateValidationSettingsValue: PropTypes.func.isRequired,
  updateValidationCurrentView: PropTypes.func.isRequired,
  updateValidationMessageValue: PropTypes.func.isRequired,
};

export default AssetFileSizeValidation;
