import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TextField, ValidationMessage } from '@contentful/forma-36-react-components';
import styles from './styles';
import { toString } from 'lodash';
import DimensionsParameters from './components/DimensionsParametersComponent';

const AssetImageDimensionsValidations = ({
  validation,
  errorMessages,
  updateValidationSettingsValue,
  updateValidationMessageValue
}) => {
  const [message, setMessage] = useState(validation.message);
  const [width, setWidthSettings] = useState(validation.settings.width);
  const [height, setHeightSettings] = useState(validation.settings.height);

  useEffect(() => {
    updateValidationSettingsValue({ width, height });
  }, [width, height, updateValidationSettingsValue]);

  useEffect(() => {
    updateValidationMessageValue(message);
  }, [message, updateValidationMessageValue]);

  return (
    <>
      <DimensionsParameters type="width" settings={width} setSettings={setWidthSettings} />
      <DimensionsParameters
        className={styles.marginTopS}
        type="height"
        settings={height}
        setSettings={setHeightSettings}
      />
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

AssetImageDimensionsValidations.propTypes = {
  validation: PropTypes.object.isRequired,
  errorMessages: PropTypes.array.isRequired,
  updateValidationSettingsValue: PropTypes.func.isRequired,
  updateValidationMessageValue: PropTypes.func.isRequired
};

export default AssetImageDimensionsValidations;
