import React from 'react';
import { CreateTagModal } from './CreateTagModal';
import { act, fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReadTagsProvider } from 'features/content-tags/core/state/ReadTagsProvider';
import { Notification } from '@contentful/forma-36-react-components';
import { TagsRepoContext } from 'features/content-tags/core/state/TagsRepoContext';

import { waitFor } from '@testing-library/dom';

describe('A CreateTagModal', () => {
  beforeEach(() => {
    jest.spyOn(Notification, 'success').mockImplementation(() => {});
    jest.spyOn(Notification, 'error').mockImplementation(() => {});
  });

  it('does render a component', async () => {
    const { modal } = setup();
    expect(modal).toBeInTheDocument();
  });

  it('does have a name input, id input and visibility radio buttons', async () => {
    const { nameTextField, idTextField, publicVisibilityInput, privateVisibilityInput } = setup();
    expect(nameTextField).toBeInTheDocument();
    expect(idTextField).toBeInTheDocument();
    expect(publicVisibilityInput).toBeInTheDocument();
    expect(privateVisibilityInput).toBeInTheDocument();
  });

  it('has disabled submit buttons by default', async () => {
    const { continuesSubmit, submit } = setup();
    expect(continuesSubmit).toBeInTheDocument();
    expect(continuesSubmit).toBeDisabled();
    expect(submit).toBeDisabled();
    expect(submit).toBeInTheDocument();
  });

  it('has default name, id and visibility input values', async () => {
    const { nameTextField, idTextField, form } = setup();
    expect(nameTextField).toBeInTheDocument();
    expect(idTextField).toBeInTheDocument();
    expect(form).toHaveFormValues({ name: '', id: '', visibility: 'private' });
  });

  it('receives name input and sets untouched id', async () => {
    const { form, events, nameInput } = setup();

    act(() => {
      events.change(nameInput, {
        target: { value: 'Hello World' },
      });
    });

    expect(form).toHaveFormValues({ name: 'Hello World', id: 'helloWorld', visibility: 'private' });
  });

  it('receives id input', async () => {
    const { form, events, idInput } = setup();

    act(() => {
      events.change(idInput, {
        target: { value: 'hello-world' },
      });
    });

    expect(form).toHaveFormValues({ name: '', id: 'hello-world', visibility: 'private' });
  });

  it('receives name input and keeps touched id', async () => {
    const { form, events, idInput, nameInput } = setup();

    act(() => {
      events.change(idInput, { target: { value: 'hello-world' } });
    });

    act(() => {
      events.change(nameInput, { target: { value: 'Hello World' } });
    });

    expect(form).toHaveFormValues({
      name: 'Hello World',
      id: 'hello-world',
      visibility: 'private',
    });
  });

  it('lets visibility public or private be selected', () => {
    const { form, publicVisibilityInput, privateVisibilityInput } = setup();
    expect(form).toHaveFormValues({ visibility: 'private' });

    userEvent.click(publicVisibilityInput);
    expect(publicVisibilityInput).toBeChecked();
    expect(privateVisibilityInput).not.toBeChecked();
    expect(form).toHaveFormValues({ visibility: 'public' });

    userEvent.click(privateVisibilityInput);
    expect(privateVisibilityInput).toBeChecked();
    expect(publicVisibilityInput).not.toBeChecked();
    expect(form).toHaveFormValues({ visibility: 'private' });
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

  it('calls onClose and resets the form after submit', async () => {
    const onClose = jest.fn();
    const { form, events, nameInput, submit } = setup({ onClose, isShown: true });

    act(() => {
      events.change(nameInput, { target: { value: 'Hello World' } });
    });

    expect(submit).toBeEnabled();

    await act(async () => {
      submit.click();
      await waitFor(() =>
        expect(form).toHaveFormValues({ name: '', id: '', visibility: 'private' })
      );
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose and resets the form after cancelling', async () => {
    const onClose = jest.fn();
    const { form, events, nameInput, cancel } = setup({ onClose, isShown: true });

    act(() => {
      events.change(nameInput, { target: { value: 'Hello World' } });
    });
    await act(async () => {
      cancel.click();
      await waitFor(() =>
        expect(form).toHaveFormValues({ name: '', id: '', visibility: 'private' })
      );
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('calls reset after successfully creating a new tag', async () => {
    const { form, events, nameInput, publicVisibilityInput, continuesSubmit } = setup({
      isShown: true,
      onClose: jest.fn(),
    });

    expect(form).toHaveFormValues({ name: '', id: '', visibility: 'private' });

    act(() => {
      events.change(nameInput, { target: { value: 'Hello World' } });
    });

    userEvent.click(publicVisibilityInput);

    expect(continuesSubmit).toBeEnabled();
    expect(form).toHaveFormValues({ name: 'Hello World', id: 'helloWorld', visibility: 'public' });

    await act(async () => {
      await continuesSubmit.click();
    });

    await act(async () => {
      await waitFor(() =>
        expect(form).toHaveFormValues({ name: '', id: '', visibility: 'private' })
      );
    });

    await act(async () => {
      await waitFor(() =>
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
      await waitFor(() => expect(form).toHaveFormValues({ name: '', id: givenIdInput }));
    });

    expect(
      queries.getByText(/Use only Latin letters, numbers, dots, hyphens and underscores./)
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
      await waitFor(() => expect(form).toHaveFormValues({ name: 'Hello World', id: 'helloWorld' }));
    });
  });

  it("doesn't allow id with prefix 'contentful.'", async () => {
    const { events, idInput, queries, form } = setup();

    await act(async () => {
      events.change(idInput, { target: { value: 'contentful.test-id' } });
    });

    await act(async () => {
      await waitFor(() => expect(form).toHaveFormValues({ name: '', id: 'contentful.test-id' }));
    });

    expect(
      queries.getByText(
        /Nice try! Unfortunately, we keep the "contentful." tag ID prefix for internal purposes./
      )
    ).toBeInTheDocument();
  });

  it('shows two create buttons when it is opened without inline creation', async () => {
    const { submit, continuesSubmit, inlineSubmit } = setup();
    expect(submit).toBeInTheDocument();
    expect(continuesSubmit).toBeInTheDocument();
    expect(inlineSubmit).not.toBeInTheDocument();
  });

  it('shows one create button text when it is opened via inline creation', async () => {
    const { submit, continuesSubmit, inlineSubmit } = setup({
      isInline: true,
      inlineData: { name: 'hello world', id: 'helloWorld' },
    });
    expect(inlineSubmit).toBeInTheDocument();
    expect(submit).not.toBeInTheDocument();
    expect(continuesSubmit).not.toBeInTheDocument();
  });

  it('prefills the form with data from inline creation', async () => {
    const { form } = setup({
      isInline: true,
      inlineData: { name: 'hello world', id: 'helloWorld' },
    });
    await waitFor(() =>
      expect(form).toHaveFormValues({
        name: 'hello world',
        id: 'helloWorld',
        visibility: 'private',
      })
    );
  });
});

function setup(props = {}, tagsRepo = {}) {
  props = { isShown: true, isInline: false, onClose: jest.fn(), ...props };
  const defaultTagsRepo = {
    createTag: jest.fn().mockResolvedValue(true),
    readTags: jest.fn().mockResolvedValue({ total: 0, items: [] }),
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
    publicVisibilityInput: queries
      .getByTestId('public-visibility-checkbox')
      .querySelector('input[type="radio"]'),
    privateVisibilityInput: queries
      .getByTestId('private-visibility-checkbox')
      .querySelector('input[type="radio"]'),
    idTextField: queries.getByTestId('create-content-tag-id-field'),
    idInput: queries.getByTestId('create-content-tag-id-input'),
    continuesSubmit: queries.queryByTestId('create-content-tag-continues-submit-button'),
    submit: queries.queryByTestId('create-content-tag-submit-button'),
    inlineSubmit: queries.queryByTestId('create-content-tag-inline-submit-button'),
    cancel: queries.queryByTestId('create-content-tag-cancel-button'),
    queries,
  };
}
