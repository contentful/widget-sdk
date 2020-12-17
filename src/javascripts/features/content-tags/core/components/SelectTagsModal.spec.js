import React from 'react';
import { SelectTagsModal } from './SelectTagsModal';
import { render, screen, waitFor, within } from '@testing-library/react';
import { ReadTagsProvider } from 'features/content-tags/core/state/ReadTagsProvider';
import { TagsRepoContext } from 'features/content-tags/core/state/TagsRepoContext';

describe('A SelectTagsModal', () => {
  it('renders a modal component', () => {
    render(<SelectTagsModal isShown={true} />);
    expect(screen.getByText(/Select tags/)).toBeInTheDocument();
  });
  describe('with no tags given', () => {
    it('renders the NoTagsContainer', () => {
      render(<SelectTagsModal isShown={true} />);
      expect(
        screen.getByRole('heading', { name: /organize your content with tags/i })
      ).toBeInTheDocument();
    });
  });
  describe('with at least 1 tag given', () => {
    it('hides the NoTagsContainer', () => {
      renderWithTags();
      expect(
        screen.queryByRole('heading', { name: /organize your content with tags/i })
      ).not.toBeInTheDocument();
      expect(screen.getByText(/Select tags/)).toBeInTheDocument();
    });
    it('renders the tags search box', async () => {
      renderWithTags();
      await waitFor(() =>
        expect(screen.getByRole('searchbox', { name: /search/i })).toBeInTheDocument()
      );
    });
    it('renders selected tags', async () => {
      const selectedTags = [{ value: 'tagId', label: 'tagName' }];
      renderWithTags(selectedTags);
      await waitFor(() =>
        expect(screen.getByRole('searchbox', { name: /search/i })).toBeInTheDocument()
      );
      const tagsList = screen.getByTestId('selected-tags-list');
      expect(tagsList).toBeInTheDocument();
      expect(within(tagsList).getByText(/tagName/)).toBeInTheDocument();
    });
  });
});

function renderWithTags(selectedTags = []) {
  const defaultTagsRepo = {
    createTag: jest.fn().mockResolvedValue(true),
    readTags: jest.fn().mockResolvedValue({
      total: 1,
      items: [
        {
          name: 'tagName',
          sys: { id: 'tagId' },
        },
      ],
    }),
    updateTag: jest.fn().mockResolvedValue(true),
    deleteTag: jest.fn().mockResolvedValue(true),
  };
  render(
    <TagsRepoContext.Provider value={defaultTagsRepo}>
      <ReadTagsProvider>
        <SelectTagsModal isShown={true} selectedTags={selectedTags} />
      </ReadTagsProvider>
    </TagsRepoContext.Provider>
  );
}
