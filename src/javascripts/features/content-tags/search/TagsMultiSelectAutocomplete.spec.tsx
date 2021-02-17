import React from 'react';
import { render, screen } from '@testing-library/react';
import { TagsMultiSelectAutocomplete } from 'features/content-tags/search/TagsMultiSelectAutocomplete';
import { TagsRepoContext } from 'features/content-tags/core/state/TagsRepoContext';
import { ReadTagsProvider } from 'features/content-tags/core/state/ReadTagsProvider';

describe('TagsMultiSelectAutocomplete component', () => {
  describe('Autocomplete modal is controlled with "isFocused" prop', () => {
    it('isFocused = false', () => {
      renderTagsMultiSelectAutocomplete({});
      const dropdown = screen.queryByTestId('select-tags-modal');
      expect(dropdown).not.toBeInTheDocument();
    });
    it('isFocused = true', () => {
      renderTagsMultiSelectAutocomplete({ isFocused: true });
      const dropdown = screen.getByTestId('select-tags-modal');
      expect(dropdown).toBeInTheDocument();
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

  const defaultTagsRepo = {
    createTag: jest.fn().mockResolvedValue(true),
    readTags: jest.fn().mockResolvedValue({
      total: 1,
      items: tags,
    }),
    updateTag: jest.fn().mockResolvedValue(true),
    deleteTag: jest.fn().mockResolvedValue(true),
  };

  render(
    <TagsRepoContext.Provider value={defaultTagsRepo}>
      <ReadTagsProvider>
        <TagsMultiSelectAutocomplete
          tags={tags}
          isFocused={isFocused}
          onChange={jest.fn()}
          onQueryChange={jest.fn()}
          selectedTags={[]}
          setIsRemovable={() => false}
        />
      </ReadTagsProvider>
    </TagsRepoContext.Provider>
  );
}
