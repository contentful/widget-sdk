import React from 'react';
import { render, cleanup, fireEvent } from 'react-testing-library';
import SearchFilter from './SearchFilter.es6';

describe('SearchFilter', () => {
  const options = [
    { label: 'Any', value: '' },
    { label: 'Papaya', value: 'papaya' },
    { label: 'Banana', value: 'banana' },
    { label: 'Kiwi', value: 'kiwi' }
  ];

  const onChangeCb = jest.fn();
  const initialProps = {
    id: 'fruit',
    label: 'Fruit',
    options,
    onChange: onChangeCb,
    filter: {
      key: 'fruit',
      value: 'papaya',
      operator: null
    }
  };
  const build = (props = initialProps) => {
    return render(<SearchFilter {...props} />);
  };

  afterEach(cleanup);
  afterEach(onChangeCb.mockReset);

  it('displays the correct label', () => {
    const { getByTestId } = build();
    expect(getByTestId('search-filter.label')).toHaveTextContent('Fruit');
  });

  it('selects the correct option', () => {
    const { getByDisplayValue } = build();
    const select = getByDisplayValue('Papaya');
    expect(select).not.toBeNull();
  });

  it('selects different options', () => {
    const { getByDisplayValue, rerender } = build();
    const filter = { key: 'fruit', value: 'banana' };
    const newProps = { ...initialProps, filter };
    rerender(<SearchFilter {...newProps} />);
    const select = getByDisplayValue('Banana');
    expect(select).not.toBeNull();
  });

  it('calls the onChange callback with the updated filter', () => {
    const { getByTestId } = build();
    const selectEl = getByTestId('search-filter.options');
    fireEvent.change(selectEl, { target: { value: 'kiwi' } });
    expect(onChangeCb).toHaveBeenCalledWith({
      id: 'fruit',
      key: 'fruit',
      operator: null,
      value: 'kiwi'
    });
  });
});
