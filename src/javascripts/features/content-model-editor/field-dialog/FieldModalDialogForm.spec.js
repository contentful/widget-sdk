import React from 'react';
import { render, fireEvent, within, wait } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FieldModalDialogForm } from './FieldModalDialogForm';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { CurrentSpaceAPIClientProvider } from 'core/services/APIClient/CurrentSpaceAPIClientContext';

describe('Field Modal Dialog Form', () => {
  it('updated field title successfully', () => {
    const onCloseMock = jest.fn();
    const updateFieldOnScope = jest.fn();
    const { getByTestId } = render(
      <SpaceEnvContext.Provider value={{ currentSpaceContentTypes: [] }}>
        <CurrentSpaceAPIClientProvider>
          <FieldModalDialogForm
            onClose={onCloseMock}
            ctField={{
              apiName: 'title',
              disabled: false,
              id: 'title',
              localized: true,
              name: 'Title',
              omitted: false,
              required: true,
              type: 'Symbol',
              validations: [],
            }}
            widget={{}}
            contentType={{ data: { displayField: 'title', sys: { id: 'id' } } }}
            updateFieldOnScope={updateFieldOnScope}
            editorInterface={{}}
            customWidgets={[]}
          />
        </CurrentSpaceAPIClientProvider>
      </SpaceEnvContext.Provider>
    );
    const titleInput = getByTestId('content-type-field-name');
    expect(titleInput).toBeVisible();
    userEvent.type(within(titleInput).getByTestId('cf-ui-text-input'), 'New Title');
    userEvent.click(getByTestId('save-field-dialog-form'));
    wait(() => expect(onCloseMock).toBeCalled());
    wait(() => expect(updateFieldOnScope).toBeCalled());
  });
  it('returns validation error on saving form with an empty field', async () => {
    const onCloseMock = jest.fn();
    const updateFieldOnScopeMock = jest.fn();
    const { getByTestId, findByText } = render(
      <SpaceEnvContext.Provider value={{ currentSpaceContentTypes: [] }}>
        <CurrentSpaceAPIClientProvider>
          <FieldModalDialogForm
            onClose={onCloseMock}
            ctField={{
              apiName: 'title',
              disabled: false,
              id: 'title',
              localized: true,
              name: 'Title',
              omitted: false,
              required: true,
              type: 'Symbol',
              validations: [],
            }}
            widget={{}}
            contentType={{ data: { displayField: 'title', sys: { id: 'id' } } }}
            updateFieldOnScope={updateFieldOnScopeMock}
            editorInterface={{}}
            customWidgets={[]}
          />
        </CurrentSpaceAPIClientProvider>
      </SpaceEnvContext.Provider>
    );
    const titleInput = getByTestId('content-type-field-name');
    expect(titleInput).toBeVisible();
    fireEvent.change(within(titleInput).getByTestId('cf-ui-text-input'), {
      target: { value: '' },
    });
    userEvent.click(getByTestId('save-field-dialog-form'));
    wait(() => expect(onCloseMock).toBeCalled());
    wait(() => expect(updateFieldOnScopeMock).toBeCalled());
    expect(await findByText('This field is required')).toBeVisible();
  });
});
