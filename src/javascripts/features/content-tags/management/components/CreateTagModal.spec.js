import React from 'react';
import { CreateTagModal } from './CreateTagModal';
import { act, fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReadTagsProvider } from 'features/content-tags/core/state/ReadTagsProvider';
import { Notification } from '@contentful/forma-36-react-components';
import { TagsRepoContext } from 'features/content-tags/core/state/TagsRepoContext';
/*
 * We should add '@testing-library/dom' to get 'waitFor'
 * instead of using transitive (hidden) dependency 'dom-testing-library'
 */
import { wait } from 'dom-testing-library';

describe('A CreateTagModal', () => {
  beforeEach(() => {
    jest.spyOn(Notification, 'success').mockImplementation(() => {});
    jest.spyOn(Notification, 'error').mockImplementation(() => {});
  });

  it('does render a component', async () => {
    const { modal } = setup();
    expect(modal).toBeInTheDocument();
  });

  it('does have a name and id input', async () => {
    const { nameTextField, idTextField } = setup();
    expect(nameTextField).toBeInTheDocument();
    expect(idTextField).toBeInTheDocument();
  });

  it('has disabled submit buttons by default', async () => {
    const { continuesSubmit, submit } = setup();
    expect(continuesSubmit).toBeInTheDocument();
    expect(continuesSubmit).toBeDisabled();
    expect(submit).toBeDisabled();
    expect(submit).toBeInTheDocument();
  });

  it('has default name and id input values', async () => {
    const { nameTextField, idTextField, form } = setup();
    expect(nameTextField).toBeInTheDocument();
    expect(idTextField).toBeInTheDocument();
    expect(form).toHaveFormValues({ name: '', id: '' });
  });

  it('receives name input and sets untouched id', async () => {
    const { form, events, nameInput } = setup();

    act(() => {
      events.change(nameInput, {
        target: { value: 'Hello World' },
      });
    });

    expect(form).toHaveFormValues({ name: 'Hello World', id: 'helloWorld' });
  });

  it('receives id input', async () => {
    const { form, events, idInput } = setup();

    act(() => {
      events.change(idInput, {
        target: { value: 'hello-world' },
      });
    });

    expect(form).toHaveFormValues({ name: '', id: 'hello-world' });
  });

  it('receives name input and keeps touched id', async () => {
    const { form, events, idInput, nameInput } = setup();

    act(() => {
      events.change(idInput, { target: { value: 'hello-world' } });
    });

    act(() => {
      events.change(nameInput, { target: { value: 'Hello World' } });
    });

    expect(form).toHaveFormValues({ name: 'Hello World', id: 'hello-world' });
  });

  it('enables submit on valid form', async () => {
    const { events, nameInput, submit, continuesSubmit } = setup();

    expect(submit).toBeDisabled();
    expect(continuesSubmit).toBeDisabled();

    act(() => {
      events.change(nameInput, { target: { value: 'Hello World' } });
    });

    expect(submit).toBeEnabled();
    expect(continuesSubmit).toBeEnabled();
  });

  it('calls onClose after submit', async () => {
    const onClose = jest.fn();
    const { form, events, nameInput, submit } = setup({ onClose, isShown: true });

    act(() => {
      events.change(nameInput, { target: { value: 'Hello World' } });
    });

    expect(submit).toBeEnabled();

    await act(async () => {
      submit.click();
      await wait(() => expect(form).toHaveFormValues({ name: '', id: '' }));
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('calls reset after successfully create a new tag', async () => {
    const { form, events, nameInput, continuesSubmit } = setup({
      isShown: true,
      onClose: jest.fn(),
    });

    expect(form).toHaveFormValues({ name: '', id: '' });

    act(() => {
      events.change(nameInput, { target: { value: 'Hello World' } });
    });

    expect(continuesSubmit).toBeEnabled();
    expect(form).toHaveFormValues({ name: 'Hello World', id: 'helloWorld' });

    await act(async () => {
      await continuesSubmit.click();
    });

    await act(async () => {
      await wait(() => expect(form).toHaveFormValues({ name: '', id: '' }));
    });

    await act(async () => {
      await wait(() =>
        expect(Notification.success).toHaveBeenCalledWith('Successfully created tag "Hello World".')
      );
    });
  });

  it.each([
    'hello world',
    'hello, world',
    'hello_world!',
    'hello/world',
    'hello>world',
    'hello<world',
    'hello+world',
    'hello#world',
  ])('errors on invalid id input "%s"', async (givenIdInput) => {
    const { events, idInput, queries, form } = setup();

    act(() => {
      events.change(idInput, { target: { value: givenIdInput } });
    });

    await act(async () => {
      await wait(() => expect(form).toHaveFormValues({ name: '', id: givenIdInput }));
    });

    expect(
      queries.getByText(/Please use only letters, numbers and underscores/)
    ).toBeInTheDocument();
  });

  it('fails on wrong version', async () => {
    const { form, events, nameInput, submit } = setup(
      { isShown: true, onClose: jest.fn() },
      {
        // TODO: use real server response
        createTag: jest.fn().mockRejectedValue('VersionMismatch'),
      }
    );

    act(() => {
      events.change(nameInput, { target: { value: 'Hello World' } });
    });

    await act(async () => {
      submit.click();
    });

    await act(async () => {
      expect(Notification.error).toHaveBeenCalledWith('An error occurred creating tag.');
      await wait(() => expect(form).toHaveFormValues({ name: 'Hello World', id: 'helloWorld' }));
    });
  });
});

function setup(props = { isShown: true, onClose: jest.fn() }, tagsRepo = {}) {
  const defaultTagsRepo = {
    createTag: jest.fn().mockResolvedValue(true),
    readTags: jest.fn().mockResolvedValue([]),
    updateTag: jest.fn().mockResolvedValue(true),
    deleteTag: jest.fn().mockResolvedValue(true),
  };

  const queries = render(
    <TagsRepoContext.Provider value={{ ...defaultTagsRepo, ...tagsRepo }}>
      <ReadTagsProvider>
        <CreateTagModal {...props} />
      </ReadTagsProvider>
    </TagsRepoContext.Provider>
  );

  return {
    events: { ...userEvent, ...fireEvent },
    modal: queries.getByTestId('create-content-tags-modal'),
    form: queries.getByTestId('create-content-tags-form'),
    nameTextField: queries.getByTestId('create-content-tag-name-field'),
    nameInput: queries.getByTestId('create-content-tag-name-input'),
    idTextField: queries.getByTestId('create-content-tag-id-field'),
    idInput: queries.getByTestId('create-content-tag-id-input'),
    continuesSubmit: queries.getByTestId('create-content-tag-continues-submit-button'),
    submit: queries.getByTestId('create-content-tag-submit-button'),
    queries,
  };
}
