import React from 'react';
import { screen, render, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagsSelection } from 'features/content-tags/editor/components/TagsSelection';
import { FilteredTagsProvider, ReadTagsProvider, TagsRepoContext } from 'features/content-tags';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';

jest.mock('features/contentful-apps', () => ({
  fetchContentfulAppsConfig: jest.fn().mockResolvedValue({
    isPurchased: true,
    isEnabled: true,
    isInstalled: true,
    isTrialAvailable: true,
  }),
}));

const spaceEnvValues = {
  currentSpace: {
    data: {
      spaceMember: {
        admin: true,
      },
    },
  },
};

const makeTag = ({ id, name, visibility }) => ({ name, sys: { id, visibility } });
const generateTags = (amount, group) =>
  new Array(amount).fill(group).map((val, idx) =>
    makeTag({
      id: `${val.toLowerCase()}${idx}${idx}`,
      name: `${val}: ${idx}${idx}`,
      visibility: 'private',
    })
  );

const localTags = [...generateTags(4, 'Team'), ...generateTags(2, 'Year')];

const newTag = makeTag({
  id: 'newTag',
  name: 'new tag',
  visibility: 'private',
});

const readTags = jest
  .fn()
  .mockResolvedValue({ items: localTags }) // default
  .mockResolvedValueOnce({ items: localTags }) // first call
  .mockResolvedValueOnce({ items: [...localTags, newTag] }); // second call

const createTag = jest.fn().mockImplementation((id, name, visibility) =>
  makeTag({
    id,
    visibility,
    name,
  })
);

const onAdd = jest.fn();

describe('The TagsSelection Component', () => {
  it('filters the tags based on the input search', async () => {
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
        value: 'Team: 1',
      },
    });
    // 1 team + inline creation item
    expect(await screen.findAllByTestId('autocomplete.dropdown-list-item')).toHaveLength(2);
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

  it('doesn\'t show "(create new)" tag item when the search input match an existing tag', async () => {
    await renderTagsSelection();
    const searchInput = screen.getByTestId('autocomplete.input');
    fireEvent.change(searchInput, {
      target: {
        value: 'Team: 2',
      },
    });

    expect(await screen.findByText(/(create new)/i)).toBeInTheDocument();

    fireEvent.change(searchInput, {
      target: {
        value: 'Team: 22',
      },
    });

    expect(screen.queryByText(/(create new)/i)).not.toBeInTheDocument();
  });

  it('doesn\'t show "(create new)" tag item when hasCreateInlineCreation set to false', async () => {
    await renderTagsSelection({ hasInlineTagCreation: false });
    const searchInput = screen.getByTestId('autocomplete.input');
    fireEvent.change(searchInput, {
      target: {
        value: 'Team: Berli',
      },
    });

    expect(await screen.queryByText(/(create new)/i)).not.toBeInTheDocument();

    fireEvent.change(searchInput, {
      target: {
        value: 'Team: Berlin',
      },
    });

    expect(screen.queryByText(/(create new)/i)).not.toBeInTheDocument();
  });

  it("doesn't show any suggestion when user tries to add an already assigned tag to an entry", async () => {
    await renderTagsSelection();
    const searchInput = screen.getByTestId('autocomplete.input');
    fireEvent.change(searchInput, {
      target: {
        value: 'Year: 1',
      },
    });

    expect(await screen.findByText(/(create new)/i)).toBeInTheDocument();

    fireEvent.change(searchInput, {
      target: {
        value: 'Year: 11',
      },
    });

    expect(await screen.queryByText(/no matches/i)).toBeInTheDocument();
  });

  describe('Tag selection during inline creation', () => {
    const newTagName = 'new tag';
    const newTagId = 'newTag';
    const changedTagName = 'changed tag';
    const changedTagId = 'changedTag';
    const newTagData = {
      id: newTagId,
      name: newTagName,
      visibility: 'private',
    };

    beforeEach(async () => {
      await renderTagsSelection();
      fireEvent.change(screen.getByTestId('autocomplete.input'), {
        target: {
          value: newTagName,
        },
      });
      fireEvent.click(screen.getByText(/(create new)/i));
    });

    it('does not immediately create a new tag when "create item" is clicked', async () => {
      expect(createTag).not.toHaveBeenCalled();
    });

    it('opens the tag selection modal when "create item" is clicked', async () => {
      expect(await screen.queryByText(/create and add tag/i)).toBeInTheDocument();
    });

    it('adds the new tag to the selection after successful creation', async () => {
      const createButton = await screen.queryByText(/create and add tag/i);
      const data = await screen.queryByTestId('create-content-tags-form');
      expect(data).toHaveFormValues(newTagData);
      userEvent.click(createButton);
      expect(createTag).toHaveBeenCalledWith(newTagId, newTagName, 'private');
      await waitFor(() => expect(readTags).toHaveBeenCalledTimes(2));
      expect(onAdd).toHaveBeenCalledWith({
        label: newTagName,
        value: newTagId,
        visibility: 'private',
      });
    });

    it('can add a tag with visibility "public"', async () => {
      const data = await screen.queryByTestId('create-content-tags-form');
      const createButton = await screen.queryByText(/create and add tag/i);
      const publicRadioButton = screen
        .queryByTestId('public-visibility-checkbox')
        .querySelector('input[type="radio"]');

      expect(data).toHaveFormValues(newTagData);

      expect(publicRadioButton).not.toBeChecked();
      userEvent.click(publicRadioButton);
      expect(publicRadioButton).toBeChecked();
      expect(data).toHaveFormValues({
        visibility: 'public',
      });

      userEvent.click(createButton);

      expect(createTag).toHaveBeenCalledWith(newTagId, newTagName, 'public');
      await waitFor(() => expect(readTags).toHaveBeenCalledTimes(2));
      expect(onAdd).toHaveBeenCalledWith({
        label: newTagName,
        value: newTagId,
        visibility: 'public',
      });
    });

    it('it creates and adds the correct tag data if it is changed within the modal', async () => {
      const idInput = screen.getByTestId('create-content-tag-id-input');
      const nameInput = screen.getByTestId('create-content-tag-name-input');
      const data = screen.getByTestId('create-content-tags-form');
      const createButton = await screen.queryByText(/create and add tag/i);

      await waitFor(() =>
        expect(screen.getByTestId('create-content-tags-form')).toHaveFormValues(newTagData)
      );

      fireEvent.change(idInput, { target: { value: changedTagId } });
      fireEvent.change(nameInput, { target: { value: changedTagName } });

      expect(data).toHaveFormValues({
        name: changedTagName,
        id: changedTagId,
      });

      userEvent.click(createButton);

      expect(createTag).toHaveBeenCalledWith(changedTagId, changedTagName, 'private');
      await waitFor(() => expect(readTags).toHaveBeenCalledTimes(2));
      expect(onAdd).toHaveBeenCalledWith({
        label: changedTagName,
        value: changedTagId,
        visibility: 'private',
      });
    });
    it('does not add a new tag when the modal is closed via clicking "cancel"', async () => {
      const cancelButton = screen.queryByTestId('create-content-tag-cancel-button');
      await waitFor(() =>
        expect(screen.getByTestId('create-content-tags-form')).toHaveFormValues(newTagData)
      );
      userEvent.click(cancelButton);
      expect(createTag).not.toHaveBeenCalled();
      expect(readTags).toHaveBeenCalledTimes(1);
      expect(onAdd).not.toHaveBeenCalled();
    });
    it('the modal has name and id preinserted', async () => {
      expect(await screen.queryByTestId('create-content-tags-form')).toHaveFormValues(newTagData);
    });
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
    fireEvent.click(screen.getByText(/(create new)/i));

    await screen.findByText(/Tag wasn’t created/i);
  });
});

async function renderTagsSelection(props = {}) {
  /*
   * this test set up provides some tags and it has one selected by default
   * It is also provides a space environment where the user is an Admin (so it can handle tags)
   */

  const defaultTagsRepo = {
    createTag,
    readTags,
    updateTag: jest.fn().mockResolvedValue(true),
    deleteTag: jest.fn().mockResolvedValue(true),
  };

  const tagsSelectionProps = {
    disabled: false,
    selectedTags: [{ value: 'year11', label: 'Year: 11' }],
    label: 'Tags',
    onAdd,
    onRemove: jest.fn(),
    hasInlineTagCreation: true,
    ...props,
  };

  render(
    <SpaceEnvContext.Provider value={spaceEnvValues}>
      <TagsRepoContext.Provider value={defaultTagsRepo}>
        <ReadTagsProvider>
          <FilteredTagsProvider>
            <TagsSelection {...tagsSelectionProps} />
          </FilteredTagsProvider>
        </ReadTagsProvider>
      </TagsRepoContext.Provider>
    </SpaceEnvContext.Provider>
  );

  await screen.findByText('Tags');
}
