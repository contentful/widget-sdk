/* eslint-disable react/prop-types */
// TODO: add prop-types
import React from 'react';
import { find } from 'lodash';

function getSelectWidth(label) {
  const width = label.length + 6;
  return Math.max(7, width) + 'ch';
}

const Select = props => {
  const { testId, options = [], value, inputRef, onChange, onKeyDown } = props;
  const [_, label] = find(options, ([v]) => v === value) || ['', ''];
  const width = getSelectWidth(label);

  return (
    <select
      className="input-reset search__select"
      title={label}
      data-test-id={testId}
      value={value || ''}
      ref={inputRef}
      onChange={({ target: { value } }) => onChange(value)}
      tabIndex="0"
      onKeyDown={onKeyDown}
      style={{ width }}>
      {options.map(([value, label]) => SelectOption(value, label))}
    </select>
  );
};

function SelectOption(value, label) {
  return (
    <option value={value || ''} key={value}>
      {label}
    </option>
  );
}

export default Select;
