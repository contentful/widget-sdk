/* eslint-disable react/prop-types */
// TODO: add prop-types
import React from 'react';
import createReactClass from 'create-react-class';
import { find } from 'lodash';

function getSelectWidth (label) {
  const width = label.length + 6;
  return Math.max(7, width) + 'ch';
}

const Select = createReactClass({
  render () {
    const {
      testId,
      options = [],
      value,
      inputRef,
      onChange,
      onKeyDown
    } = this.props;
    const [_, label] = find(options, ([v]) => v === value) || ['', ''];
    const width = getSelectWidth(label);

    return React.createElement('select', {
      className: 'input-reset search__select',
      title: label,
      'data-test-id': testId,
      value: value || '',
      ref: inputRef,
      onChange: ({ target: { value } }) => onChange(value),
      tabIndex: '0',
      onKeyDown,
      style: {width}
    }, options.map(([value, label]) => SelectOption(value, label)));
  }
});

function SelectOption (value, label) {
  return React.createElement('option', {
    value: value || '',
    key: value
  }, label);
}

export default Select;
