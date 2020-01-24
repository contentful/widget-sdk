import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Select, Option, TextInput } from '@contentful/forma-36-react-components';
import { toString, toNumber, map, findLast, isFinite } from 'lodash';
import styles from '../styles';

const units = [
  { label: 'Bytes', factor: 1 },
  { label: 'KB', factor: 1024 },
  { label: 'MB', factor: 1024 * 1024 }
];

const unitFactors = map(units, 'factor');

const getDisplayValue = (value, factor) => (isFinite(value) ? value / factor : null);

const getUnitFactor = baseValue => {
  const factor = findLast(unitFactors, factor => baseValue / factor >= 1);
  return factor || unitFactors[0];
};

const getScaledValue = (displayValue, factor) => {
  return isFinite(displayValue) ? displayValue * factor : null;
};

const FileSizeComponent = ({ type, value, onUpdate }) => {
  const [factor, setFactor] = useState(() => getUnitFactor(value));
  const [displayValue, setDisplayValue] = useState(() => getDisplayValue(value, factor));
  const [scaledValue, setScaledValue] = useState(value);

  useEffect(() => {
    setScaledValue(getScaledValue(displayValue, factor));
  }, [displayValue, factor]);

  useEffect(() => {
    onUpdate(scaledValue);
  }, [scaledValue, onUpdate]);

  return (
    <>
      <TextInput
        testId="min-size-input"
        className={styles.textInputNumber}
        placeholder={type}
        type="number"
        value={toString(displayValue)}
        onChange={({ target: { value } }) => setDisplayValue(toNumber(value))}
        width="small"
      />
      <Select
        name="Select size unit"
        testId="select-size-unit"
        onChange={({ target: { value } }) => setFactor(toNumber(value))}
        value={toString(factor)}
        width="small">
        {units.map(({ label, factor }, index) => (
          <Option key={index} value={toString(factor)}>
            {label}
          </Option>
        ))}
      </Select>
    </>
  );
};

FileSizeComponent.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.number,
  onUpdate: PropTypes.func.isRequired
};

export default FileSizeComponent;
