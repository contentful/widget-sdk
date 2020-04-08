import React from 'react';
import DeleteTagModal from './DeleteTagModal';
import { render, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReadTagsProvider from '../providers/ReadTagsProvider';
import { TagsRepoContext } from '../providers/TagsRepoProvider';

describe('DeleteTagModal', () => {
  it('has disabled button state by default', async () => {
    const { submitButton } = await setup();
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('has enabled button on check confirmation', async () => {
    const { submitButton, confirmInput } = await setup();
    expect(submitButton).toBeDisabled();
    expect(confirmInput).not.toBeChecked();
    act(() => {
      userEvent.click(confirmInput);
    });
    expect(confirmInput).toBeChecked();
    expect(submitButton).toBeEnabled();
  });

  it('calls deleteTag endpoint', async () => {
    const deleteTag = jest.fn();
    const { submitButton, confirmInput } = await setup(
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
    act(() => {
      userEvent.click(confirmInput);
    });
    expect(submitButton).toBeEnabled();
    act(() => {
      userEvent.click(submitButton);
    });
    expect(deleteTag).toHaveBeenCalledWith('test', 3);
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
    readTags: jest.fn().mockResolvedValue([]),
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
    confirmInput: await queries.findByTestId('delete-tag-modal-input'),
  };
}
