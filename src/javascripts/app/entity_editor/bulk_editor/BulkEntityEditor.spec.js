import React from 'react';
import { BulkEntityEditor } from './BulkEntityEditor';
import { render, waitFor } from '@testing-library/react';
import * as K from 'core/utils/kefir';

import { initStateController } from '../stateController';
import { initDocErrorHandler } from 'app/entity_editor/DocumentErrorHandler';
import { localFieldChanges, valuePropertyAt } from '@contentful/editorial-primitives';

jest.mock('services/localeStore', () => ({
  getPrivateLocales: jest.fn().mockReturnValue({}),
  getDefaultLocale: jest.fn().mockReturnValue({}),
}));
jest.mock('detect-browser', () => ({
  detect: jest.fn().mockReturnValue({ name: 'chrome' }),
}));
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
  createForEntity: jest.fn().mockReturnValue({ hasFieldLocaleError: jest.fn() }),
}));
jest.mock('app/entity_editor/EntityField/EntityField', () => ({
  EntityField: () => <div data-test-id="entity-field-controls" />,
}));
jest.mock('../stateController', () => ({
  initStateController: jest.fn(),
}));

jest.mock('app/entity_editor/DocumentErrorHandler', () => ({
  initDocErrorHandler: jest.fn(),
}));
jest.mock('../../widgets/ExtensionSDKs/createCmaDocumentWithApiNames', () => ({
  createCmaDocumentWithApiNames: jest.fn(),
}));
jest.mock('services/localeStore', () => ({
  getLocales: jest.fn(),
  getPrivateLocales: jest.fn(),
}));

jest.mock('core/services/SpaceEnvContext', () => ({
  ...jest.requireActual('core/services/SpaceEnvContext'),
  useSpaceEnvContentTypes: jest.fn().mockReturnValue({
    currentSpaceContentTypes: [{ sys: { id: 'CT-1' } }],
  }),
}));
jest.mock('@contentful/editorial-primitives', () => ({
  localFieldChanges: jest.fn(),
  valuePropertyAt: jest.fn(),
  Validator: {
    createForEntry: jest.fn().mockReturnValue({ id: 'test' }),
  },
}));
jest.mock('app/widgets/ExtensionSDKs', () => ({
  createEditorExtensionSDK: jest.fn(),
}));
jest.mock('app/entry_editor/formWidgetsController', () => ({
  filterWidgets: jest.fn().mockReturnValue([
    {
      fieldId: '1',
      field: {
        disabled: false,
      },
      isVisible: true,
    },
  ]),
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
    entityInfo: { contentType: { sys: { id: 'CT-1' } } },
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
      editorSettings: {
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

  it('should render the workbench with the field editor after initial load', async () => {
    const { props, editorData, queryByTestId } = renderComponent();
    await waitFor(() => expect(queryByTestId('entity-workbench')).toBeInTheDocument());
    expect(queryByTestId('entity-field-controls')).toBeInTheDocument();
    expect(queryByTestId('bulk-entity-editor-actions-dropdown')).toBeInTheDocument();
    expect(queryByTestId('bulk-entity-editor-status-dropdown')).toBeInTheDocument();

    expect(initDocErrorHandler).toHaveBeenCalledTimes(1);
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

    expect(initDocErrorHandler).toHaveBeenCalledTimes(1);
    expect(initStateController).toHaveBeenCalledTimes(1);

    expect(props.bulkEditorContext.loadEditorData).toHaveBeenCalledTimes(1);
    expect(editorData.openDoc).toHaveBeenCalledTimes(1);
  });

  it('should render nothing if no editorData was fetched', async () => {
    const { queryByTestId } = renderComponent({
      bulkEditorContext: { loadEditorData: jest.fn().mockResolvedValue(null) },
    });
    await waitFor(() => expect(queryByTestId('entity-loader')).not.toBeInTheDocument());
    expect(queryByTestId('entity-field-controls')).not.toBeInTheDocument();
    expect(queryByTestId('bulk-entity-editor-actions-dropdown')).not.toBeInTheDocument();
    expect(queryByTestId('bulk-entity-editor-status-dropdown')).not.toBeInTheDocument();

    expect(initDocErrorHandler).not.toHaveBeenCalled();
    expect(initStateController).not.toHaveBeenCalled();
  });

  it('should be able to collapse the entity', async () => {
    const { props, editorData, queryByTestId } = renderComponent();
    await waitFor(() => expect(queryByTestId('entity-workbench')).toBeInTheDocument());
    expect(queryByTestId('entity-field-controls')).toBeInTheDocument();
    expect(queryByTestId('bulk-entity-editor-actions-dropdown')).toBeInTheDocument();
    expect(queryByTestId('bulk-entity-editor-status-dropdown')).toBeInTheDocument();

    queryByTestId('bulk-editor-title').click();
    await waitFor(() => expect(queryByTestId('entity-field-controls')).not.toBeInTheDocument());

    queryByTestId('bulk-editor-title').click();
    await waitFor(() => expect(queryByTestId('entity-field-controls')).toBeInTheDocument());

    expect(initDocErrorHandler).toHaveBeenCalledTimes(1);
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
