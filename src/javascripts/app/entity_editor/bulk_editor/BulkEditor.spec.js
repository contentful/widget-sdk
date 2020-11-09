import React from 'react';
import { BulkEditor } from './BulkEditor';
import { render, waitFor } from '@testing-library/react';
import * as K from 'core/utils/kefir';

import * as DataLoader from 'app/entity_editor/DataLoader';
import { getModule } from 'core/NgRegistry';
import { entitySelector } from 'features/entity-search';

jest.mock('services/localeStore', () => ({
  getPrivateLocales: jest.fn().mockReturnValue(['en-US']),
  getDefaultLocale: jest.fn().mockReturnValue('en-US'),
  getFocusedLocale: jest.fn().mockReturnValue('en-US'),
  getActiveLocales: jest.fn().mockReturnValue(['en-US']),
}));
jest.mock('detect-browser', () => ({
  detect: jest.fn().mockReturnValue({ name: 'chrome' }),
}));
jest.mock('core/NgRegistry', () => ({ getModule: jest.fn() }));
jest.mock('app/entity_editor/DataLoader', () => ({ makePrefetchEntryLoader: jest.fn() }));
jest.mock('ui/Framework/AngularComponent', () => () => <div data-test-id="angular-component" />);
jest.mock('features/entity-search', () => ({
  entitySelector: { openFromField: jest.fn() },
  useEntitySelectorSdk: jest.fn().mockReturnValue('entitySelectorSdk'),
}));
jest.mock('app/widgets/ExtensionSDKs', () => ({
  createEditorExtensionSDK: jest.fn(),
}));

const contentType = { sys: { id: 'ct-1' }, getId: () => 'ct-1' };

const mockSpaceContext = {
  getId: jest.fn().mockReturnValue('space-1'),
  space: {},
  getEnvironmentId: jest.fn().mockReturnValue('env-id'),
  isMasterEnvironment: jest.fn().mockReturnValue(true),
  publishedCTs: {
    getAllBare: jest.fn().mockReturnValue([contentType]),
    get: jest.fn().mockReturnValue(contentType),
  },
  cma: { createEntry: jest.fn() },
};
getModule.mockReturnValue(mockSpaceContext);

function createMockProperty(initial) {
  const bus = K.createBus();
  const property = bus.stream.toProperty(() => initial);
  property.set = (val) => bus.emit(val);

  return property;
}

function makeLink(id) {
  return {
    sys: {
      id: id,
      linkType: 'Entry',
      type: 'Link',
    },
  };
}

const renderComponent = (extraReferenceContext = {}, ids = ['id1', 'id2']) => {
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
    ...extraReferenceContext?.otDoc,
  };

  const editorData = {
    entityInfo: { contentType: { id: 'CT-1' } },
    fieldControls: {
      form: [],
      all: [],
    },
    customEditor: null,
    openDoc: jest.fn().mockReturnValue(otDoc),
    ...extraReferenceContext?.editorData,
  };

  const loadEditorData = jest.fn().mockResolvedValue(editorData);

  DataLoader.makePrefetchEntryLoader.mockReturnValue(loadEditorData);

  const referenceContext = {
    focusIndex: null,
    editorSettings: {
      showDisabledFields: false,
    },
    parentId: 'parentId',
    links$: createMockProperty(ids.map(makeLink)),
    field: {
      name: 'fieldName',
      items: {
        linkType: 'Entry',
        validations: [],
      },
    },
    close: jest.fn(),
    remove: jest.fn(),
    add: jest.fn(),
    ...extraReferenceContext,
  };

  const props = {
    getReferenceContext: () => referenceContext,
  };

  const component = render(<BulkEditor {...props} />);
  return { ...component, props, referenceContext, loadEditorData };
};

describe('BulkEntityEditor', () => {
  it('should render the loading component and hide the loading entities', async () => {
    const { queryByTestId, queryAllByTestId } = renderComponent();
    expect(queryByTestId('bulk-editor-loader')).toBeInTheDocument();
    queryAllByTestId('bulk-editor-entity').map((entity) => {
      expect(entity).toBeInTheDocument();
      expect(entity.className.includes('hidden')).toBe(true);
    });
  });

  it('should render the empty state', async () => {
    const { queryByTestId } = renderComponent(undefined, []);
    expect(queryByTestId('bulk-editor-empty-state')).toBeInTheDocument();
  });

  it('should render the entities when the loading was completed', async () => {
    const { queryByTestId, queryAllByTestId } = renderComponent();
    await waitFor(() => expect(queryByTestId('bulk-editor-loader')).not.toBeInTheDocument());
    queryAllByTestId('bulk-editor-entity').map((entity) => {
      expect(entity).toBeInTheDocument();
      expect(entity.className.includes('hidden')).toBe(false);
    });
  });

  it('should be able to link an existing entry', async () => {
    const { queryByTestId } = renderComponent();
    await waitFor(() => expect(queryByTestId('bulk-editor-loader')).not.toBeInTheDocument());
    queryByTestId('add-existing-entry').click();
    expect(entitySelector.openFromField).toHaveBeenCalledWith(
      'entitySelectorSdk',
      {
        itemLinkType: 'Entry',
        itemValidations: [],
        items: { linkType: 'Entry', validations: [] },
        name: 'fieldName',
      },
      2
    );
  });

  it('should be able to close the bulk editor', async () => {
    const { queryByTestId, referenceContext } = renderComponent();
    await waitFor(() => expect(queryByTestId('bulk-editor-loader')).not.toBeInTheDocument());
    queryByTestId('bulk-editor-close').click();
    expect(referenceContext.close).toHaveBeenCalledWith('bulk_editor_close');
  });
});
