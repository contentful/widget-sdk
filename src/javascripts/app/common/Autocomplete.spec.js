import React from 'react';
import { render, cleanup, fireEvent, within } from '@testing-library/react';
import Autocomplete from './Autocomplete.es6';
import 'jest-dom/extend-expect';

const items = [
  { label: 'Jalapeño', id: 'jalapeno' },
  { label: 'Lime', id: 'lime' },
  { label: 'Avocado', id: 'avocado' },
  { label: 'Coriander', id: 'coriander' }
];

describe('Autocomplete', () => {
  let onChangeFn;
  let onQueryChangeFn;

  afterEach(cleanup);

  const build = ({ placeholder, width } = {}) => {
    onChangeFn = jest.fn();
    onQueryChangeFn = jest.fn();

    return render(
      <Autocomplete
        items={items}
        onChange={onChangeFn}
        onQueryChange={onQueryChangeFn}
        placeholder={placeholder}
        width={width}>
        {options =>
          options.map(option => (
            <span key={option.id} data-test-id="option-content">
              {options.label}
            </span>
          ))
        }
      </Autocomplete>
    );
  };

  describe('search input', () => {
    it('displays the input field', () => {
      const { getByTestId } = build();
      const input = getByTestId('autocomplete.input');
      expect(input).toBeInTheDocument();
    });

    it('calls the onQueryChange callback', () => {
      const { getByTestId } = build();
      const input = getByTestId('autocomplete.input');
      fireEvent.change(input, { target: { value: 'foo' } });
      expect(onQueryChangeFn).toHaveBeenCalledWith('foo');
    });

    it('displays the placeholder text', () => {
      const { getByTestId } = build();
      const input = getByTestId('autocomplete.input');
      expect(input).toHaveAttribute('placeholder', 'Search');
    });
    it('shows the dropdown', () => {
      const { getByTestId } = build();
      const input = getByTestId('autocomplete.input');
      fireEvent.keyDown(input, { keyCode: 40 });
      const dropdown = getByTestId('autocomplete.dropdown-list');
      expect(dropdown).toBeVisible();
    });
  });

  describe('dropdown', () => {
    let input, dropdown, options;

    beforeEach(() => {
      const { getByTestId } = build();
      input = getByTestId('autocomplete.input');
      fireEvent.keyDown(input, { keyCode: 40 });
      dropdown = getByTestId('autocomplete.dropdown-list');
      options = within(dropdown).getAllByTestId('autocomplete.dropdown-list-item');
    });

    it('displays the list of items', () => {
      expect(options).toHaveLength(items.length);
    });

    it('marks the first item as active', () => {
      // can't test this right now
    });
    it('marks the last item as active', () => {
      // can't test this right now
    });
    it('navigates down', () => {
      // can't test this right now
    });
    it('navigates up', () => {
      // can't test this right now
    });
    it('calls the onChange callback when the selecting an item with the enter key', () => {
      fireEvent.keyDown(input, { keyCode: 13 }); // select the first item
      expect(onChangeFn).toHaveBeenCalledWith(items[0]);
    });
    it('calls the onChange callback when selecting an item with a mouse click', () => {
      const button = within(options[1]).getByTestId('cf-ui-dropdown-list-item-button');
      fireEvent.click(button); // select the second item
      expect(onChangeFn).toHaveBeenCalledWith(items[1]);
    });
    it('dismisses the dropdown when selecting with the enter key', () => {
      fireEvent.keyDown(input, { keyCode: 13 });
      const dropdown = within(document).queryByTestId('autocomplete.dropdown-list');
      expect(dropdown).toBeNull();
    });
  });
});
