/* eslint-disable react/prop-types */
import React from 'react';
import { match } from 'utils/TaggedValues';
import classNames from 'classnames';

import { Date, FilterValueReference, MetadataTag, TextValueInput, Select } from './ValueInput';
import { FilterValueInputs as ValueInput } from 'core/services/ContentQuery';
import { Keys } from './Keys';

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
          onChange,
        }}
      />
    </div>
  );
}

function FilterValue({ valueInput, value, isFocused, onChange, onRemove, setIsRemovable, op }) {
  const inputRef = (el) => {
    if (isFocused && el) {
      window.requestAnimationFrame(() => el.focus());
    }
  };

  const handleKeyDown = (e) => {
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
    [ValueInput.MetadataTag]: () => {
      return (
        <MetadataTag
          operator={op}
          testId={valueTestId}
          value={value}
          setIsRemovable={setIsRemovable}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          isFocused={isFocused}
        />
      );
    },
    [ValueInput.Select]: (options) => {
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
    [ValueInput.Reference]: (ctField) => {
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
    },
  });

  return input || null;
}

function FilterValueAssetSize(props) {
  return (
    <TextValueInput
      {...props}
      value={props.value}
      onChange={(nextValue) => props.onChange(nextValue)}
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

export function FilterPill({
  className,
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
  onRemoveAttempt = () => {},
}) {
  return (
    <div
      className={classNames('search__filter-pill', {
        [className]: className,
      })}
      data-test-id={testId}
      ref={(el) => {
        if (isFocused && el) {
          window.requestAnimationFrame(() => el.focus());
        }
      }}
      tabIndex="0"
      onClick={(e) => {
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        if (Keys.backspace(e)) {
          if (isRemovable) {
            onRemove();
          }
        }
      }}>
      <div className="search__filter-pill-label">
        {filter.label || filter.displayName || filter.name}
      </div>
      <FilterOperator
        operators={filter.operators}
        op={op}
        onChange={(operator) => onOperatorChange(operator)}
      />
      <FilterValue
        valueInput={filter.valueInput}
        op={op}
        value={value}
        isFocused={isValueFocused}
        onChange={(value) => onChange(value)}
        setIsRemovable={(val) => (isRemovable = val ? true : false)}
        onRemove={() => {
          if (isRemovable) {
            onRemoveAttempt();
          }
        }}
      />
    </div>
  );
}