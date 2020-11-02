import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReadTagsProvider } from 'features/content-tags/core/state/ReadTagsProvider';
import { Notification } from '@contentful/forma-36-react-components';
import { TagsRepoContext } from 'features/content-tags/core/state/TagsRepoContext';
import { UpdateTagModal } from 'features/content-tags/management/components/UpdateTagModal';
import { wait } from '@testing-library/dom';

jest.mock('data/CMA/ProductCatalog', () => ({
  FEATURES: { PC_CONTENT_TAGS: 'content_tags' },
  getSpaceFeature: jest.fn().mockResolvedValue(true),
}));

describe('A UpdateTagModal', () => {
  beforeEach(() => {
    jest.spyOn(Notification, 'success').mockImplementation(() => {});
    jest.spyOn(Notification, 'error').mockImplementation(() => {});
  });

  it('does render a component', async () => {
    const { modal } = setup();
    expect(modal).toBeInTheDocument();
  });

  it('does have a name input', async () => {
    const { nameTextField } = setup();
    expect(nameTextField).toBeInTheDocument();
  });

  it('has disabled submit button by default', async () => {
    const { submit } = setup();
    expect(submit).toBeDisabled();
    expect(submit).toBeInTheDocument();
  });

  it('has default name input value', async () => {
    const { nameTextField, form } = setup();
    expect(nameTextField).toBeInTheDocument();
    expect(form).toHaveFormValues({ name: '' });
  });

  it('respects not checked checkbox', async () => {
    const { events, nameInput, checkboxInput, submit } = setup();

    expect(submit).toBeDisabled();
    expect(checkboxInput).toHaveProperty('checked', false);

    act(() => {
      events.change(nameInput, { target: { value: 'new Hello World' } });
    });

    expect(submit).toBeDisabled();
  });

  it('enables submit on valid form', async () => {
    const { events, nameInput, checkboxInput, submit } = setup();

    expect(submit).toBeDisabled();
    expect(nameInput).toBeInTheDocument();

    act(() => {
      events.change(nameInput, { target: { value: 'new Hello World' } });
      events.click(checkboxInput);
    });

    expect(checkboxInput).toHaveProperty('checked', true);
    expect(submit).toBeEnabled();
  });

  it('calls onClose after submit', async () => {
    const onClose = jest.fn();
    const updateTag = jest.fn();
    const { events, nameInput, submit, checkboxInput } = setup(
      {
        isShown: true,
        onClose,
        tag: {
          name: 'Hello World',
          sys: { id: 'helloWorld', type: 'TAG', createdAt: '0', version: 0 },
        },
      },
      { updateTag }
    );

    updateTag.mockResolvedValue(true);

    act(() => {
      events.click(checkboxInput);
      events.change(nameInput, { target: { value: 'Hello Sky' } });
    });

    expect(submit).toBeEnabled();

    act(() => {
      submit.click();
    });

    expect(updateTag).toHaveBeenCalled();

    await act(async () => {
      expect(Notification.error).not.toHaveBeenCalled();
    });

    await act(async () => {
      expect(Notification.success).toHaveBeenCalledWith('Successfully updated tag "Hello Sky".');
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('calls reset after successfully update a tag', async () => {
    const { events, nameInput, submit, checkboxInput, tagsRepo } = setup({
      isShown: true,
      onClose: jest.fn(),
      tag: {
        name: 'Hello World',
        sys: { id: 'helloWorld', type: 'TAG', createdAt: '0', version: 0 },
      },
    });

    await act(() => {
      events.click(checkboxInput);
      events.change(nameInput, { target: { value: 'Hello Sky' } });
    });

    await act(() => {
      submit.click();
    });

    await act(async () => {
      await wait(() => expect(tagsRepo.readTags).toHaveBeenCalled());
    });
  });
});

function setup(
  props = {
    isShown: true,
    onClose: jest.fn(),
    tag: {
      name: 'Hello World',
      sys: { id: 'helloWorld', type: 'TAG', createdAt: '0', version: 0 },
    },
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
        <UpdateTagModal {...props} />
      </ReadTagsProvider>
    </TagsRepoContext.Provider>
  );

  return {
    events: { ...userEvent, ...fireEvent },
    modal: queries.getByTestId('update-content-tag-modal'),
    form: queries.getByTestId('update-content-tag-form'),
    nameTextField: queries.getByTestId('update-content-tag-name-field'),
    nameInput: queries.getByTestId('update-content-tag-name-input'),
    checkboxField: queries.getByTestId('update-content-tag-checkbox-field'),
    checkboxInput: queries.getByTestId('update-content-tag-checkbox-input'),
    submit: queries.getByTestId('update-content-tag-submit-button'),
    queries,
    tagsRepo: { ...defaultTagsRepo, ...tagsRepo },
  };
}
