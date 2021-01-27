import React from 'react';
import { DeleteTagModal } from './DeleteTagModal';
import { render, act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReadTagsProvider } from 'features/content-tags/core/state/ReadTagsProvider';
import { TagsRepoContext } from 'features/content-tags/core/state/TagsRepoContext';
import { Notification, HelpText, FormLabel } from '@contentful/forma-36-react-components';

describe('DeleteTagModal', () => {
  describe('has disabled button state', () => {
    it('by default', async () => {
      const { submitButton } = await setup();
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
    it('when only first checkbox is checked', async () => {
      const { submitButton, firstConfirmInput } = await setup();
      expect(firstConfirmInput).not.toBeChecked();

      userEvent.click(firstConfirmInput);

      expect(firstConfirmInput).toBeChecked();
      expect(submitButton).toBeEnabled();
    });
  });

  describe('toggles the validation messages correctly', () => {
    const validationText = /Check to confirm deletion/i;
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
  });

  it('has enabled button state when both checkboxes are checked', async () => {
    const { submitButton, firstConfirmInput } = await setup();
    expect(submitButton).toBeDisabled();
    expect(firstConfirmInput).not.toBeChecked();

    userEvent.click(firstConfirmInput);

    expect(firstConfirmInput).toBeChecked();
    expect(submitButton).toBeEnabled();
  });

  it('calls deleteTag endpoint', async () => {
    const promise = Promise.resolve();
    const deleteTag = jest.fn(() => promise);
    const { submitButton, firstConfirmInput } = await setup(
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

    expect(submitButton).toBeEnabled();

    userEvent.click(submitButton);

    expect(deleteTag).toHaveBeenCalledWith('test', 3);
    await act(() => promise);
  });

  it('calls deleteTag endpoint (generic error)', async () => {
    const deleteTag = jest.fn().mockRejectedValue('RandomError');
    jest.spyOn(Notification, 'success').mockImplementation(() => {});
    jest.spyOn(Notification, 'error').mockImplementation(() => {});
    const { submitButton, firstConfirmInput } = await setup(
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

    expect(submitButton).toBeEnabled();

    await act(async () => {
      submitButton.click();
    });

    expect(deleteTag).toHaveBeenCalledWith('test', 3);
    expect(Notification.error).toBeCalledWith(`Error deleting tag.`);
    expect(Notification.success).not.toBeCalled();
  });

  it('calls deleteTag endpoint (ref error)', async () => {
    const deleteTag = jest.fn().mockRejectedValue({
      code: 'ActionPreconditionsFailed',
      data: { details: { errors: [{ name: 'reference' }] } },
    });
    jest.spyOn(Notification, 'success').mockImplementation(() => {});
    jest.spyOn(Notification, 'error').mockImplementation(() => {});
    const { submitButton, firstConfirmInput } = await setup(
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

    expect(submitButton).toBeEnabled();

    await act(async () => {
      submitButton.click();
    });

    expect(deleteTag).toHaveBeenCalledWith('test', 3);
    expect(Notification.error).toBeCalledWith(
      <React.Fragment>
        <FormLabel>Can&apos;t delete tag because it is currently in use.</FormLabel>
        <HelpText>Remove the tag from all entries and assets before deleting it.</HelpText>
      </React.Fragment>
    );
    expect(Notification.success).not.toBeCalled();
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
  };
}
