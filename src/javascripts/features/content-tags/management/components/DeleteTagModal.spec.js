import React from 'react';
import { DeleteTagModal } from './DeleteTagModal';
import { render, act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReadTagsProvider } from 'features/content-tags/core/state/ReadTagsProvider';
import { TagsRepoContext } from 'features/content-tags/core/state/TagsRepoContext';

describe('DeleteTagModal', () => {
  describe('has disabled button state', () => {
    it('by default', async () => {
      const { submitButton } = await setup();
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
    it('when only first checkbox is checked', async () => {
      const { submitButton, firstConfirmInput, secondConfirmInput } = await setup();
      expect(firstConfirmInput).not.toBeChecked();
      expect(secondConfirmInput).not.toBeChecked();

      userEvent.click(firstConfirmInput);

      expect(firstConfirmInput).toBeChecked();
      expect(submitButton).toBeDisabled();
    });
    it('when only second checkbox is checked', async () => {
      const { submitButton, firstConfirmInput, secondConfirmInput } = await setup();
      expect(firstConfirmInput).not.toBeChecked();
      expect(secondConfirmInput).not.toBeChecked();

      userEvent.click(secondConfirmInput);

      expect(secondConfirmInput).toBeChecked();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('toggles the validation messages correctly', () => {
    const validationText = /check both options to confirm deletion/i;
    it('for the first checkbox', async () => {
      const { firstConfirmInput } = await setup();

      expect(firstConfirmInput).not.toBeChecked();
      expect(screen.queryByText(validationText)).not.toBeInTheDocument();

      userEvent.click(firstConfirmInput);
      expect(firstConfirmInput).toBeChecked();
      expect(screen.queryByText(validationText)).not.toBeInTheDocument();

      userEvent.click(firstConfirmInput);
      expect(firstConfirmInput).not.toBeChecked();
      expect(screen.getByText(validationText)).toBeInTheDocument();

      userEvent.click(firstConfirmInput);
      expect(firstConfirmInput).toBeChecked();
      expect(screen.queryByText(validationText)).not.toBeInTheDocument();
    });
    it('for the second checkbox', async () => {
      const { secondConfirmInput } = await setup();

      expect(secondConfirmInput).not.toBeChecked();
      expect(screen.queryByText(validationText)).not.toBeInTheDocument();

      userEvent.click(secondConfirmInput);
      expect(secondConfirmInput).toBeChecked();
      expect(screen.queryByText(validationText)).not.toBeInTheDocument();

      userEvent.click(secondConfirmInput);
      expect(secondConfirmInput).not.toBeChecked();
      expect(screen.getByText(validationText)).toBeInTheDocument();

      userEvent.click(secondConfirmInput);
      expect(secondConfirmInput).toBeChecked();
      expect(screen.queryByText(validationText)).not.toBeInTheDocument();
    });
  });

  it('has enabled button state when both checkboxes are checked', async () => {
    const { submitButton, firstConfirmInput, secondConfirmInput } = await setup();
    expect(submitButton).toBeDisabled();
    expect(firstConfirmInput).not.toBeChecked();
    expect(secondConfirmInput).not.toBeChecked();

    userEvent.click(firstConfirmInput);
    userEvent.click(secondConfirmInput);

    expect(firstConfirmInput).toBeChecked();
    expect(secondConfirmInput).toBeChecked();
    expect(submitButton).toBeEnabled();
  });

  it('calls deleteTag endpoint', async () => {
    const promise = Promise.resolve();
    const deleteTag = jest.fn(() => promise);
    const { submitButton, firstConfirmInput, secondConfirmInput } = await setup(
      {
        isShown: true,
        onClose: jest.fn(),
        tag: {
          name: 'test',
          sys: { id: 'test', type: 'Tag', createdAt: 'asöfjasödfj', version: 3 },
        },
      },
      { deleteTag }
    );
    userEvent.click(firstConfirmInput);
    userEvent.click(secondConfirmInput);

    expect(submitButton).toBeEnabled();

    userEvent.click(submitButton);

    expect(deleteTag).toHaveBeenCalledWith('test', 3);
    await act(() => promise);
  });
});

async function setup(
  props = {
    isShown: true,
    onClose: jest.fn(),
    tag: { name: 'test', sys: { id: 'test', type: 'Tag', createdAt: 'asöfjasödfj', version: 3 } },
  },
  tagsRepo = {}
) {
  const defaultTagsRepo = {
    createTag: jest.fn().mockResolvedValue(true),
    readTags: jest.fn().mockResolvedValue({ total: 0, items: [] }),
    updateTag: jest.fn().mockResolvedValue(true),
    deleteTag: jest.fn().mockResolvedValue(true),
  };

  const queries = render(
    <TagsRepoContext.Provider value={{ ...defaultTagsRepo, ...tagsRepo }}>
      <ReadTagsProvider>
        <DeleteTagModal {...props} />
      </ReadTagsProvider>
    </TagsRepoContext.Provider>
  );

  return {
    events: { ...userEvent, ...fireEvent },
    queries,
    submitButton: await queries.findByTestId('delete-tag-modal-submit'),
    firstConfirmInput: await queries.findByTestId('delete-tag-modal-first-confirm-input'),
    secondConfirmInput: await queries.findByTestId('delete-tag-modal-second-confirm-input'),
  };
}
