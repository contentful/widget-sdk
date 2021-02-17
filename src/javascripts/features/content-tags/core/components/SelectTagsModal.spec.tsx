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
        sys: { id: 'tagId' },
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
    it('renders the NoTagsContainer', async () => {
      await renderModal(
        { isShown: true },
        {
          readTags: jest.fn().mockResolvedValue({
            total: 0,
            items: [],
          }),
        }
      );
      expect(
        screen.getByRole('heading', { name: /organize your content with tags/i })
      ).toBeInTheDocument();
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
      const selectedTags = [{ value: 'tagId', label: 'tagName' }];
      await renderWithTags(selectedTags);
      await waitFor(() =>
        expect(screen.getByRole('searchbox', { name: /search/i })).toBeInTheDocument()
      );
      const tagsList = screen.getByTestId('selected-tags-list');
      expect(tagsList).toBeInTheDocument();
      expect(within(tagsList).getByText(/tagName/)).toBeInTheDocument();
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
