import React from 'react';
import { screen, render, fireEvent } from '@testing-library/react';

import { TagsSelection } from 'features/content-tags/editor/components/TagsSelection';
import { FilteredTagsProvider, ReadTagsProvider, TagsRepoContext } from 'features/content-tags';

const createTag = jest.fn().mockResolvedValue({
  sys: {
    space: { sys: { type: 'Link', linkType: 'Space', id: 'm8xyo6sh8zj8' } },
    id: 'pepper',
    type: 'Tag',
    createdAt: '2021-01-14T09:59:01.027Z',
    updatedAt: '2021-01-14T09:59:01.027Z',
    version: 1,
  },
  name: 'pepper',
});

describe('TagsSelection Component', () => {
  it('filters the tags base on the input search', async () => {
    await renderTagsSelection();
    const searchInput = screen.getByTestId('autocomplete.input');
    fireEvent.change(searchInput, {
      target: {
        value: 'Team:',
      },
    });

    // 4 teams + inline creation item
    expect(await screen.findAllByTestId('autocomplete.dropdown-list-item')).toHaveLength(5);

    fireEvent.change(searchInput, {
      target: {
        value: 'Team: Lisbo',
      },
    });
    // 2 teams + inline creation item
    expect(await screen.findAllByTestId('autocomplete.dropdown-list-item')).toHaveLength(3);
  });

  it('shows "(create new)" tag item when the search input doesn\'t match an existing tag', async () => {
    await renderTagsSelection();
    fireEvent.change(screen.getByTestId('autocomplete.input'), {
      target: {
        value: 'this will be a new tag',
      },
    });

    const inlineCreationItem = await screen.findByText(/(create new)/i);
    expect(inlineCreationItem).toBeInTheDocument();
  });

  it(' doesn\'t show "(create new)" tag item when the search input match an existing tag', async () => {
    await renderTagsSelection();
    const searchInput = screen.getByTestId('autocomplete.input');
    fireEvent.change(searchInput, {
      target: {
        value: 'Team: Berli',
      },
    });

    expect(await screen.findByText(/(create new)/i)).toBeInTheDocument();

    fireEvent.change(searchInput, {
      target: {
        value: 'Team: Berlin',
      },
    });

    expect(screen.queryByText(/(create new)/i)).not.toBeInTheDocument();
  });

  it(" doesn't show any suggestion when user tries to add an already assigned tag to an entry", async () => {
    await renderTagsSelection();
    const searchInput = screen.getByTestId('autocomplete.input');
    fireEvent.change(searchInput, {
      target: {
        value: 'Market: Tai',
      },
    });

    expect(await screen.findByText(/(create new)/i)).toBeInTheDocument();

    fireEvent.change(searchInput, {
      target: {
        value: 'Market: Taiwan',
      },
    });

    expect(await screen.queryByText(/no matches/i)).toBeInTheDocument();
  });

  it('calls createTag function with the correct arguments when the create item is click', async () => {
    await renderTagsSelection();
    fireEvent.change(screen.getByTestId('autocomplete.input'), {
      target: {
        value: 'pepper',
      },
    });

    await screen.findByText(/(create new)/i);

    fireEvent.click(screen.getByRole('button', { name: /(create new)/i }));
    await screen.findByText(/tags/i);

    expect(createTag).toHaveBeenCalledWith('pepper', 'pepper');
  });

  it("shows a validation message when the search input includes the name space 'contentful.'", async () => {
    await renderTagsSelection();
    fireEvent.change(screen.getByTestId('autocomplete.input'), {
      target: {
        value: 'contentful.',
      },
    });

    await screen.findByText(
      /Nice try! Unfortunately, we keep the "contentful." tag ID prefix for internal purposes./i
    );
  });

  it("shows an error notification when the user tries to create a tag that includes the name space 'contentful.'", async () => {
    await renderTagsSelection();

    fireEvent.change(screen.getByTestId('autocomplete.input'), {
      target: {
        value: 'contentful.',
      },
    });

    await screen.findByText(/(create new)/i);
    fireEvent.click(screen.getByRole('button', { name: /(create new)/i }));

    await screen.findByText(/Tag wasn’t created/i);
  });
});

async function renderTagsSelection() {
  const localTags = [
    {
      sys: {
        space: { sys: { type: 'Link', linkType: 'Space', id: 'm8xyo6sh8zj8' } },
        id: 'teamDenver',
        type: 'Tag',
        createdAt: '2021-01-18T12:16:25.341Z',
        updatedAt: '2021-01-18T12:16:25.341Z',
        environment: { sys: { id: 'no-tags-at-all', type: 'Link', linkType: 'Environment' } },
        createdBy: { sys: { type: 'Link', linkType: 'User', id: '0DxkEpRWNGmuSrDf704wJM' } },
        updatedBy: { sys: { type: 'Link', linkType: 'User', id: '0DxkEpRWNGmuSrDf704wJM' } },
        version: 1,
      },
      name: 'Team: Denver',
    },
    {
      sys: {
        space: { sys: { type: 'Link', linkType: 'Space', id: 'm8xyo6sh8zj8' } },
        id: 'teamBerlin',
        type: 'Tag',
        createdAt: '2021-01-18T12:16:32.922Z',
        updatedAt: '2021-01-18T12:16:32.922Z',
        environment: { sys: { id: 'no-tags-at-all', type: 'Link', linkType: 'Environment' } },
        createdBy: { sys: { type: 'Link', linkType: 'User', id: '0DxkEpRWNGmuSrDf704wJM' } },
        updatedBy: { sys: { type: 'Link', linkType: 'User', id: '0DxkEpRWNGmuSrDf704wJM' } },
        version: 1,
      },
      name: 'Team: Berlin',
    },
    {
      sys: {
        space: { sys: { type: 'Link', linkType: 'Space', id: 'm8xyo6sh8zj8' } },
        id: 'teamLisboa',
        type: 'Tag',
        createdAt: '2021-01-18T12:17:32.752Z',
        updatedAt: '2021-01-18T12:17:32.752Z',
        environment: { sys: { id: 'no-tags-at-all', type: 'Link', linkType: 'Environment' } },
        createdBy: { sys: { type: 'Link', linkType: 'User', id: '0DxkEpRWNGmuSrDf704wJM' } },
        updatedBy: { sys: { type: 'Link', linkType: 'User', id: '0DxkEpRWNGmuSrDf704wJM' } },
        version: 1,
      },
      name: 'Team: Lisboa',
    },
    {
      sys: {
        space: { sys: { type: 'Link', linkType: 'Space', id: 'm8xyo6sh8zj8' } },
        id: 'teamLisboa2',
        type: 'Tag',
        createdAt: '2021-01-18T12:18:12.542Z',
        updatedAt: '2021-01-18T12:18:12.542Z',
        environment: { sys: { id: 'no-tags-at-all', type: 'Link', linkType: 'Environment' } },
        createdBy: { sys: { type: 'Link', linkType: 'User', id: '0DxkEpRWNGmuSrDf704wJM' } },
        updatedBy: { sys: { type: 'Link', linkType: 'User', id: '0DxkEpRWNGmuSrDf704wJM' } },
        version: 1,
      },
      name: 'Team: Lisboa-2',
    },
    {
      sys: {
        space: { sys: { type: 'Link', linkType: 'Space', id: 'm8xyo6sh8zj8' } },
        id: 'boom',
        type: 'Tag',
        createdAt: '2021-01-14T09:59:01.027Z',
        updatedAt: '2021-01-14T09:59:01.027Z',
        environment: { sys: { id: 'no-tags-at-all', type: 'Link', linkType: 'Environment' } },
        createdBy: { sys: { type: 'Link', linkType: 'User', id: '0DxkEpRWNGmuSrDf704wJM' } },
        updatedBy: { sys: { type: 'Link', linkType: 'User', id: '0DxkEpRWNGmuSrDf704wJM' } },
        version: 1,
      },
      name: 'boom',
    },
    {
      sys: {
        space: { sys: { type: 'Link', linkType: 'Space', id: 'm8xyo6sh8zj8' } },
        id: 'marketTaiwan',
        type: 'Tag',
        createdAt: '2020-06-23T10:47:01.333Z',
        updatedAt: '2020-06-23T10:47:01.333Z',
        environment: {
          sys: { id: 'exploratory-environment', type: 'Link', linkType: 'Environment' },
        },
        createdBy: { sys: { type: 'Link', linkType: 'User', id: '0Wqpu0iURWIzkfkG7a4pKb' } },
        updatedBy: { sys: { type: 'Link', linkType: 'User', id: '0Wqpu0iURWIzkfkG7a4pKb' } },
        version: 1,
      },
      name: 'Market: Taiwan',
    },
  ];

  const defaultTagsRepo = {
    createTag,
    readTags: jest.fn().mockResolvedValue({ total: localTags.length, items: localTags }),
    updateTag: jest.fn().mockResolvedValue(true),
    deleteTag: jest.fn().mockResolvedValue(true),
  };

  const tagsSelectionProps = {
    disabled: false,
    showEmpty: true,
    selectedTags: [{ value: 'marketTaiwan', label: 'Market: Taiwan' }],
    label: 'Tags',
    onAdd: jest.fn(),
    onRemove: jest.fn(),
  };
  render(
    <TagsRepoContext.Provider value={{ ...defaultTagsRepo }}>
      <ReadTagsProvider>
        <FilteredTagsProvider>
          <TagsSelection {...tagsSelectionProps} />
        </FilteredTagsProvider>
      </ReadTagsProvider>
    </TagsRepoContext.Provider>
  );

  await screen.findByText('Tags');
}
