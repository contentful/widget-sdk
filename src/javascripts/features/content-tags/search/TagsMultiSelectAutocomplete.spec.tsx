import React from 'react';
import { screen, render, fireEvent, waitFor } from '@testing-library/react';
import { TagsMultiSelectAutocomplete } from 'features/content-tags/search/TagsMultiSelectAutocomplete';

describe('TagsMultiSelectAutocomplete component', () => {
  describe('Autocomplete dropdown is controlled with "isFocused" prop', () => {
    it('isFocused = false', () => {
      renderTagsMultiSelectAutocomplete({});
      const dropdown = screen.queryByTestId('autocomplete.dropdown-list');
      expect(dropdown).not.toBeInTheDocument();
    });
    it('isFocused = true', () => {
      renderTagsMultiSelectAutocomplete({ isFocused: true });
      const dropdown = screen.getByTestId('autocomplete.dropdown-list');
      expect(dropdown).toBeInTheDocument();
    });
  });

  describe('Autocomplete dropdown', () => {
    it('keeps the dropdown open when an item is clicked [isOpen = true]', () => {
      renderTagsMultiSelectAutocomplete({ isFocused: true });
      expect(screen.getByTestId('autocomplete.dropdown-list')).toBeInTheDocument();
      const firstItem = screen.getAllByTestId('cf-ui-dropdown-list-item-button')[0];
      fireEvent.click(firstItem);
      waitFor(() => {
        expect(screen.queryByTestId('autocomplete.dropdown-list')).toBeInTheDocument();
      });
    });
  });
});

function renderTagsMultiSelectAutocomplete({ isFocused = false }) {
  const tags = [
    {
      label: 'Black beans',
      value: 'black beans',
    },
    {
      label: 'Guacamole',
      value: 'Guacamole',
    },
    {
      label: 'Tortillas',
      value: 'Tortillas',
    },
    {
      label: 'Coriander',
      value: 'Coriander',
    },
    {
      label: 'Pork',
      value: 'Pork',
    },
    {
      label: 'Cheese',
      value: 'Cheese',
    },
  ];

  render(
    <TagsMultiSelectAutocomplete
      tags={tags}
      isFocused={isFocused}
      onChange={jest.fn()}
      onQueryChange={jest.fn()}
      maxHeight={280}
      selectedTags={[]}
      setIsRemovable={() => false}
    />
  );
}
