import React, { useState } from 'react';
import { cx } from 'emotion';
import PropTypes from 'prop-types';
import {
  Select,
  Option,
  TextInput,
  CheckboxField,
  FormLabel,
} from '@contentful/forma-36-react-components';
import styles from '../styles';
import { toString, toNumber, isNumber, isNil, startCase, isEmpty } from 'lodash';

const DimensionsParameters = ({ type, settings, setSettings, className }) => {
  const getCurrentViewState = ({ min, max }) => {
    if (min === max && !isNil(min) && !isNil(max)) {
      return 'exact';
    } else if (!isNil(min) && !isNil(max)) {
      return 'min-max';
    } else if (!isNil(min)) {
      return 'min';
    } else if (!isNil(max)) {
      return 'max';
    }
  };
  const getCheckboxState = (settings) => Object.values(settings).some((item) => isNumber(item));

  const [isChecked, setChecked] = useState(() => getCheckboxState(settings));
  const [currentView, setCurrentView] = useState(() => getCurrentViewState(settings) || 'min');

  const normalizeValue = (value) => (isEmpty(value) ? null : toNumber(value));

  const getControls = () => {
    switch (currentView) {
      case 'min':
        return (
          <PxInputField
            id={`${type}-min-px-input`}
            value={toString(settings.min)}
            onChange={(value) => {
              setSettings({ ...settings, min: normalizeValue(value) });
            }}
            disabled={!isChecked}
          />
        );
      case 'max':
        return (
          <PxInputField
            id={`${type}-max-px-input`}
            value={toString(settings.max)}
            onChange={(value) => {
              setSettings({ ...settings, max: normalizeValue(value) });
            }}
            disabled={!isChecked}
          />
        );
      case 'min-max':
        return (
          <>
            <PxInputField
              id={`${type}-min-px-input`}
              value={toString(settings.min)}
              onChange={(value) => {
                setSettings({ ...settings, min: normalizeValue(value) });
              }}
              disabled={!isChecked}
            />
            <div className={styles.union}>and</div>
            <PxInputField
              id={`${type}-max-px-input`}
              value={toString(settings.max)}
              onChange={(value) => {
                setSettings({ ...settings, max: normalizeValue(value) });
              }}
              disabled={!isChecked}
            />
          </>
        );
      case 'exact':
        return (
          <PxInputField
            id={`${type}-max-px-input`}
            value={toString(settings.max)}
            onChange={(value) => {
              setSettings({ min: normalizeValue(value), max: normalizeValue(value) });
            }}
            disabled={!isChecked}
          />
        );
      default:
        break;
    }
  };

  return (
    <div className={cx(styles.validationRow, className)}>
      <CheckboxField
        className={styles.checkbox}
        labelText={startCase(type)}
        name={`${type} dimension checkbox`}
        checked={isChecked}
        value={type}
        onChange={() => {
          setChecked(!isChecked);
          setSettings({ min: null, max: null });
        }}
        labelIsLight={true}
        id={`${type}-dimension-checkbox`}
      />
      <Select
        isDisabled={!isChecked}
        name={`Select condition for ${type}`}
        testId={`select-condition-${type}`}
        onChange={({ target: { value } }) => {
          setCurrentView(value);
          setSettings({ min: null, max: null });
        }}
        value={currentView}
        width="small">
        <Option value="min">At least</Option>
        <Option value="max">At most</Option>
        <Option value="min-max">Between</Option>
        <Option value="exact">Exactly</Option>
      </Select>
      {getControls()}
    </div>
  );
};

DimensionsParameters.propTypes = {
  className: PropTypes.string,
  type: PropTypes.string.isRequired,
  setSettings: PropTypes.func.isRequired,
  settings: PropTypes.shape({
    min: PropTypes.number,
    max: PropTypes.number,
  }),
};

export default DimensionsParameters;

const PxInputField = ({ id, value, onChange, disabled }) => {
  return (
    <div className={cx(styles.flexContainer, styles.positionRelative)}>
      <TextInput
        disabled={disabled}
        id={id}
        name="Pixel input"
        testId={id}
        value={value}
        onChange={({ target: { value } }) => onChange(value)}
        width="small"
        type="number"
        min="1"
        willBlurOnEsc
      />
      <FormLabel className={styles.pxLabel} htmlFor={id}>
        px
      </FormLabel>
    </div>
  );
};

PxInputField.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};
