import React from 'react';
import { mount } from 'enzyme';
import SearchFilter from './SearchFilter.es6';
import sinon from 'sinon';

describe('SearchFilter', () => {
  const options = [
    { label: 'Any', value: '' },
    { label: 'Papaya', value: 'papaya' },
    { label: 'Banana', value: 'banana' },
    { label: 'Kiwi', value: 'kiwi' }
  ];

  let onChangeCb, component;

  beforeEach(() => {
    onChangeCb = sinon.stub();
    component = mount(
      <SearchFilter
        label="Fruit"
        filter={{
          key: 'fruit',
          value: 'papaya',
          operator: null
        }}
        options={options}
        onChange={onChangeCb}
      />
    );
  });

  it('renders the label', () => {
    const label = component.find('.search__filter-pill-label');

    expect(label.text()).toBe('Fruit');
  });

  it('renders the value', () => {
    const value = component.find('.search__select-value');

    expect(value).toHaveLength(1);
    expect(value.find('select').prop('value')).toBe('papaya');
  });

  it('renders the options', () => {
    const optionElements = component.find('option');
    expect(optionElements).toHaveLength(options.length);
    expect(optionElements.map(option => option.text())).toEqual([
      'Any',
      'Papaya',
      'Banana',
      'Kiwi'
    ]);
  });

  it('calls the onChange callback with the updated filter', () => {
    const select = component.find('select');
    select.simulate('change', { target: { value: '' } });
    expect(onChangeCb.getCall(0).args).toEqual([
      {
        key: 'fruit',
        operator: null,
        value: ''
      }
    ]);
  });
});
