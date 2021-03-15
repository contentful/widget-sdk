import { render, screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import { ReadTagsProvider } from 'features/content-tags/core/state/ReadTagsProvider';
import { TagsRepoContext } from 'features/content-tags/core/state/TagsRepoContext';
import React from 'react';
import { SelectTagsModal } from './SelectTagsModal';
import { TagOption } from 'features/content-tags/types';

const defaultTagsRepo = {
  createTag: jest.fn().mockResolvedValue(true),
  readTags: jest.fn().mockResolvedValue({
    total: 1,
    items: [
      {
        name: 'tagName',
        sys: { id: 'tagId', visibility: 'private' },
      },
      {
        name: 'otherTagName',
        sys: { id: 'otherTagId', visibility: 'public' },
      },
    ],
  }),
  updateTag: jest.fn().mockResolvedValue(true),
  deleteTag: jest.fn().mockResolvedValue(true),
};

describe('A SelectTagsModal', () => {
  it('renders a modal component', async () => {
    await renderModal({ isShown: true });
    expect(screen.getByText(/Select tags/)).toBeInTheDocument();
  });
  describe('with no tags given', () => {
    it('renders the tags search box', async () => {
      await renderModal(
        { isShown: true },
        {
          readTags: jest.fn().mockResolvedValue({
            total: 0,
            items: [],
          }),
        }
      );
      expect(screen.getByRole('searchbox', { name: /search/i })).toBeInTheDocument();
    });
  });
  describe('with at least 1 tag given', () => {
    it('hides the NoTagsContainer', async () => {
      await renderWithTags();
      expect(
        screen.queryByRole('heading', { name: /organize your content with tags/i })
      ).not.toBeInTheDocument();
      expect(screen.getByText(/Select tags/)).toBeInTheDocument();
    });
    it('renders the tags search box', async () => {
      await renderWithTags();
      await waitFor(() =>
        expect(screen.getByRole('searchbox', { name: /search/i })).toBeInTheDocument()
      );
    });
    it('renders selected tags', async () => {
      const selectedTags: TagOption[] = [
        { value: 'tagId', label: 'tagName', visibility: 'private' },
      ];
      await renderWithTags(selectedTags);
      await waitFor(() =>
        expect(screen.getByRole('searchbox', { name: /search/i })).toBeInTheDocument()
      );
      const tagsList = screen.getByTestId('selected-tags-list');
      expect(tagsList).toBeInTheDocument();
      expect(within(tagsList).getByText(/tagName/)).toBeInTheDocument();
    });
    it('indicates if selected tags are public', async () => {
      const selectedTags: TagOption[] = [
        { value: 'tagId', label: 'tagName', visibility: 'private' },
        { value: 'otherTagId', label: 'otherTagName', visibility: 'public' },
      ];
      await renderWithTags(selectedTags);
      await waitFor(() =>
        expect(screen.getByRole('searchbox', { name: /search/i })).toBeInTheDocument()
      );
      expect(screen.getByTestId('selected-tags-list')).toBeInTheDocument();
      expect(await screen.findAllByTestId('selected-tags-list-item')).toHaveLength(2);
      expect(await screen.queryByTestId('visibility-indicator')).toBeInTheDocument();
      expect(screen.getAllByText('public')).toHaveLength(1);
    });
  });
});

async function renderModal(props, tagsRepo = {}) {
  const queries = render(
    <TagsRepoContext.Provider value={{ ...defaultTagsRepo, ...tagsRepo }}>
      <ReadTagsProvider>
        <SelectTagsModal {...props} />
      </ReadTagsProvider>
    </TagsRepoContext.Provider>
  );
  await waitForElementToBeRemoved(() => screen.getByText(/Loading/));
  return queries;
}

async function renderWithTags(selectedTags: TagOption[] = []) {
  return renderModal({ isShown: true, selectedTags });
}
