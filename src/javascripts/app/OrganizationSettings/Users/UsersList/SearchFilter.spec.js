import React from 'react';
import { mount } from 'enzyme';
import SearchFilter from './SearchFilter.es6';

describe('SearchFilter', () => {
  const options = [
    { label: 'Any', value: '' },
    { label: 'Papaya', value: 'papaya' },
    { label: 'Banana', value: 'banana' },
    { label: 'Kiwi', value: 'kiwi' }
  ];

  let onChangeCb, component;

  beforeEach(() => {
    onChangeCb = jest.fn();
    component = mount(
      <SearchFilter
        id="fruit"
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

  it('renders the component', () => {
    expect(component).toMatchSnapshot();
  });

  it('accepts empty values', () => {
    component.setProps({
      filters: {
        key: 'foo',
        value: null
      }
    });
    expect(component).toMatchSnapshot();
  });

  it('calls the onChange callback with the updated filter', () => {
    const select = component.find('select');
    select.simulate('change', { target: { value: '' } });
    expect(onChangeCb).toHaveBeenCalledWith({
      id: 'fruit',
      key: 'fruit',
      operator: null,
      value: ''
    });
  });
});
