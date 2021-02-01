import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Select, Option, TextInput, Flex } from '@contentful/forma-36-react-components';
import { toString, toNumber, map, findLast, isFinite, startCase, isEmpty } from 'lodash';
import { styles } from './styles';

const units = [
  { label: 'Bytes', factor: 1 },
  { label: 'KB', factor: 1024 },
  { label: 'MB', factor: 1024 * 1024 },
];

const unitFactors = map(units, 'factor');

const getDisplayValue = (value, factor) => (isFinite(value) ? value / factor : null);

const getUnitFactor = (baseValue) => {
  const factor = findLast(unitFactors, (factor) => baseValue / factor >= 1);
  return factor || unitFactors[0];
};

const getScaledValue = (value, factor) => {
  const displayValue = toNumber(value);
  return isFinite(displayValue) ? displayValue * factor : null;
};

const FileSizeComponent = ({ type, value, onUpdate, onBlur }) => {
  const [factor, setFactor] = useState(() => getUnitFactor(value));
  const [displayValue, setDisplayValue] = useState(() => getDisplayValue(value, factor));

  const normalizeValue = (value) => (isEmpty(value) ? null : toNumber(value));

  const onValueUpdate = (displayValue) => {
    setDisplayValue(normalizeValue(displayValue));
    const value = getScaledValue(displayValue, factor);
    onUpdate(value);
  };

  const onFactorUpdate = (factor) => {
    setFactor(normalizeValue(factor));
    const value = getScaledValue(displayValue, factor);
    onUpdate(value);
  };

  return (
    <Flex flexDirection="row" alignItems="center">
      <Flex marginRight="spacingXs">
        <TextInput
          testId={`${type}-size-input`}
          className={styles.textInputNumber}
          placeholder={startCase(type)}
          type="number"
          min="0"
          value={toString(displayValue)}
          onChange={({ target: { value } }) => onValueUpdate(value)}
          onBlur={onBlur}
          width="small"
        />
      </Flex>
      <Select
        className={styles.selectInline}
        name="Select size unit"
        testId={`select-${type}-size-unit`}
        onChange={({ target: { value } }) => onFactorUpdate(value)}
        value={toString(factor)}
        width="small">
        {units.map(({ label, factor }, index) => (
          <Option key={index} value={toString(factor)}>
            {label}
          </Option>
        ))}
      </Select>
    </Flex>
  );
};

FileSizeComponent.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.number,
  onUpdate: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
};

export { FileSizeComponent };
