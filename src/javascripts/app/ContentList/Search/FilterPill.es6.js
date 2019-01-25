/* eslint-disable react/prop-types */

import React from 'react';
import { match } from 'utils/TaggedValues.es6';
import { ValueInput } from './Filters.es6';
import Date from './ValueInput/Date.es6';
import FilterValueReference from './ValueInput/Reference.es6';
import TextValueInput from './ValueInput/Text.es6';
import Select from './ValueInput/select.es6';
import Keys from './Keys.es6';

function FilterOperator({ op, operators = [], onChange }) {
  const hasOperators = operators.length > 1;

  if (!hasOperators) {
    return null;
  }

  return (
    <div className="search_select search__select-operator">
      <Select
        {...{
          testId: '',
          options: operators,
          value: op,
          inputRef: () => {},
          onKeyDown: () => {},
          onChange
        }}
      />
    </div>
  );
}

function FilterValue({ valueInput, value, isFocused, onChange, onRemove }) {
  const inputRef = el => {
    if (isFocused && el) {
      requestAnimationFrame(() => el.focus());
    }
  };

  const handleKeyDown = e => {
    const { target } = e;
    const hasSelection = target.selectionStart !== 0 || target.selectionEnd !== 0;
    e.stopPropagation();
    if (Keys.backspace(e) && !hasSelection) {
      onRemove();
    }
  };

  const valueTestId = 'value';

  const input = match(valueInput, {
    [ValueInput.Text]: () => {
      return (
        <TextValueInput
          testId={valueTestId}
          value={value}
          inputRef={inputRef}
          onChange={onChange}
          onKeyDown={handleKeyDown}
        />
      );
    },
    [ValueInput.AssetDetailsSize]: () => {
      return (
        <FilterValueAssetSize
          testId={valueTestId}
          value={value}
          inputRef={inputRef}
          onChange={onChange}
          onKeyDown={handleKeyDown}
        />
      );
    },
    [ValueInput.Date]: () => {
      return (
        <Date
          testId={valueTestId}
          value={value}
          inputRef={inputRef}
          onChange={onChange}
          onKeyDown={handleKeyDown}
        />
      );
    },
    [ValueInput.Select]: options => {
      return (
        <FilterSelect
          testId={valueTestId}
          options={options}
          value={value}
          inputRef={inputRef}
          onChange={onChange}
          onKeyDown={handleKeyDown}
        />
      );
    },
    [ValueInput.Reference]: ctField => {
      return (
        <FilterValueReference
          testId={valueTestId}
          ctField={ctField}
          value={value}
          inputRef={inputRef}
          onChange={onChange}
          onKeyDown={handleKeyDown}
        />
      );
    }
  });

  return input || null;
}

function FilterValueAssetSize(props) {
  return (
    <TextValueInput
      {...props}
      value={props.value}
      onChange={nextValue => props.onChange(nextValue)}
    />
  );
}

function FilterSelect(props) {
  return (
    <div className="search__select-value">
      <Select {...props} />
    </div>
  );
}

export default function FilterPill({
  filter,
  op = '',
  value = '',
  testId,
  isFocused = false,
  isValueFocused = false,
  isRemovable = true,
  onChange,
  onOperatorChange = () => {},
  onRemove = () => {},
  onRemoveAttempt = () => {}
}) {
  return (
    <div
      className="search__filter-pill"
      data-test-id={testId}
      ref={el => {
        if (isFocused && el) {
          requestAnimationFrame(() => el.focus());
        }
      }}
      tabIndex="0"
      onClick={e => {
        e.stopPropagation();
      }}
      onKeyDown={e => {
        if (Keys.backspace(e)) {
          if (isRemovable) {
            onRemove();
          }
          e.stopPropagation();
          e.preventDefault();
        }
      }}>
      <div className="search__filter-pill-label">{filter.label || filter.name}</div>
      <FilterOperator
        operators={filter.operators}
        op={op}
        onChange={operator => onOperatorChange(operator)}
      />
      <FilterValue
        valueInput={filter.valueInput}
        value={value}
        isFocused={isValueFocused}
        onChange={value => onChange(value)}
        onRemove={() => {
          if (isRemovable) {
            onRemoveAttempt();
          }
        }}
      />
    </div>
  );
}
