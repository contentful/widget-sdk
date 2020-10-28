import React from 'react';
import { BulkEntityEditor } from './BulkEntityEditor';
import { render, waitFor } from '@testing-library/react';
import * as K from 'core/utils/kefir';

import { initStateController } from '../stateController';
import { initDocErrorHandlerWithoutScope } from 'app/entity_editor/DocumentErrorHandler';
import { localFieldChanges, valuePropertyAt } from 'app/entity_editor/Document';

jest.mock('services/localeStore', () => ({
  getPrivateLocales: jest.fn().mockReturnValue({}),
  getDefaultLocale: jest.fn().mockReturnValue({}),
}));
jest.mock('detect-browser', () => ({
  detect: jest.fn().mockReturnValue({ name: 'chrome' }),
}));
jest.mock('ui/Framework/AngularComponent', () => () => <div data-test-id="angular-component" />);
jest.mock('app/entry_editor/CustomEditorExtensionRenderer', () => () => (
  <div data-test-id="custom-editor-extension-renderer" />
));
jest.mock('./BulkEntityEditorActionsDropdown', () => ({ unlink }) => (
  <div data-test-id="bulk-entity-editor-actions-dropdown" onClick={unlink} />
));
jest.mock('./BulkEntityEditorStatusDropdown', () => () => (
  <div data-test-id="bulk-entity-editor-status-dropdown" />
));
jest.mock('app/entity_editor/Validator', () => ({
  createForEntry: jest.fn().mockReturnValue('validator'),
}));
jest.mock('../stateController', () => ({
  initStateController: jest.fn(),
}));
jest.mock('app/entity_editor/DocumentErrorHandler', () => ({
  initDocErrorHandlerWithoutScope: jest.fn(),
}));
jest.mock('app/entity_editor/Document', () => ({
  localFieldChanges: jest.fn(),
  valuePropertyAt: jest.fn(),
}));
jest.mock('app/widgets/ExtensionSDKs', () => ({
  createEditorExtensionSDK: jest.fn(),
}));

localFieldChanges.mockReturnValue(K.createBus().stream);
valuePropertyAt.mockReturnValue(K.createBus().stream);

const renderComponent = (extraProps = {}) => {
  const otDoc = {
    changes: K.createBus().stream,
    resourceState: {
      stateChange$: K.createBus().stream,
    },
    state: {
      error$: [],
      loaded$: {
        onValue: jest.fn().mockImplementation((fn) => fn(true)),
      },
    },
    ...extraProps?.otDoc,
  };

  const editorData = {
    entityInfo: { contentType: { id: 'CT-1' } },
    fieldControls: {
      form: [],
      all: [],
    },
    customEditor: null,
    openDoc: jest.fn().mockReturnValue(otDoc),
    ...extraProps?.editorData,
  };

  const props = {
    entityContext: {
      id: 'id-1',
      key: 'key-1',
      ...extraProps?.entityContext,
    },
    onRemove: jest.fn(),
    onEditorInitialized: jest.fn(),
    bulkEditorContext: {
      scrollTarget$: K.createBus().stream,
      loadEditorData: jest.fn().mockResolvedValue(editorData),
      preferences: {
        showDisabledFields: false,
      },
      track: {
        changeStatus: jest.fn(),
        edited: jest.fn(),
        actions: jest.fn().mockReturnValue({
          setExpansion: jest.fn(),
          openInEntryEditor: jest.fn(),
          unlink: jest.fn(),
        }),
      },
      ...extraProps?.bulkEditorContext,
    },
    localeData: {
      focusedLocale: { internal_code: 'de-DE' },
      defaultLocale: { internal_code: 'en-US' },
      isSingleLocaleModeOn: true,
      ...extraProps?.localeData,
    },
  };

  const component = render(<BulkEntityEditor {...props} />);
  return { ...component, props, editorData, otDoc };
};

describe('BulkEntityEditor', () => {
  it('should render the loader', async () => {
    const { queryByTestId } = renderComponent();
    expect(queryByTestId('entity-loader')).toBeInTheDocument();
  });

  it('should render the workbench with the angular component after initial load', async () => {
    const { props, editorData, queryByTestId } = renderComponent();
    await waitFor(() => expect(queryByTestId('entity-workbench')).toBeInTheDocument());
    expect(queryByTestId('angular-component')).toBeInTheDocument();
    expect(queryByTestId('bulk-entity-editor-actions-dropdown')).toBeInTheDocument();
    expect(queryByTestId('bulk-entity-editor-status-dropdown')).toBeInTheDocument();

    expect(initDocErrorHandlerWithoutScope).toHaveBeenCalledTimes(1);
    expect(initStateController).toHaveBeenCalledTimes(1);

    expect(props.bulkEditorContext.loadEditorData).toHaveBeenCalledTimes(1);
    expect(editorData.openDoc).toHaveBeenCalledTimes(1);
  });

  it('should render the workbench with the custom extension renderer component after initial load', async () => {
    const { props, editorData, queryByTestId } = renderComponent({
      editorData: { customEditor: {} },
    });
    await waitFor(() => expect(queryByTestId('entity-workbench')).toBeInTheDocument());
    expect(queryByTestId('custom-editor-extension-renderer')).toBeInTheDocument();
    expect(queryByTestId('bulk-entity-editor-actions-dropdown')).toBeInTheDocument();
    expect(queryByTestId('bulk-entity-editor-status-dropdown')).toBeInTheDocument();

    expect(initDocErrorHandlerWithoutScope).toHaveBeenCalledTimes(1);
    expect(initStateController).toHaveBeenCalledTimes(1);

    expect(props.bulkEditorContext.loadEditorData).toHaveBeenCalledTimes(1);
    expect(editorData.openDoc).toHaveBeenCalledTimes(1);
  });

  it('should render nothing if no editorData was fetched', async () => {
    const { queryByTestId } = renderComponent({
      bulkEditorContext: { loadEditorData: jest.fn().mockResolvedValue(null) },
    });
    await waitFor(() => expect(queryByTestId('entity-loader')).not.toBeInTheDocument());
    expect(queryByTestId('angular-component')).not.toBeInTheDocument();
    expect(queryByTestId('bulk-entity-editor-actions-dropdown')).not.toBeInTheDocument();
    expect(queryByTestId('bulk-entity-editor-status-dropdown')).not.toBeInTheDocument();

    expect(initDocErrorHandlerWithoutScope).not.toHaveBeenCalled();
    expect(initStateController).not.toHaveBeenCalled();
  });

  it('should be able to collapse the entity', async () => {
    const { props, editorData, queryByTestId } = renderComponent();
    await waitFor(() => expect(queryByTestId('entity-workbench')).toBeInTheDocument());
    expect(queryByTestId('angular-component')).toBeInTheDocument();
    expect(queryByTestId('bulk-entity-editor-actions-dropdown')).toBeInTheDocument();
    expect(queryByTestId('bulk-entity-editor-status-dropdown')).toBeInTheDocument();

    queryByTestId('bulk-editor-title').click();
    await waitFor(() => expect(queryByTestId('angular-component')).not.toBeInTheDocument());

    queryByTestId('bulk-editor-title').click();
    await waitFor(() => expect(queryByTestId('angular-component')).toBeInTheDocument());

    expect(initDocErrorHandlerWithoutScope).toHaveBeenCalledTimes(1);
    expect(initStateController).toHaveBeenCalledTimes(1);

    expect(props.bulkEditorContext.loadEditorData).toHaveBeenCalledTimes(1);
    expect(editorData.openDoc).toHaveBeenCalledTimes(1);
  });

  it('should be able to unlink the entity', async () => {
    const { props, queryByTestId } = renderComponent();
    await waitFor(() => expect(queryByTestId('entity-workbench')).toBeInTheDocument());
    queryByTestId('bulk-entity-editor-actions-dropdown').click();
    expect(props.onRemove).toHaveBeenCalledTimes(1);
  });
});
