import React from 'react';
import EntryEditorWorkbench from './EntryEditorWorkbench';
import { screen, render } from '@testing-library/react';
import { createEditorContextMock } from '../../../../test/utils/createEditorContextMock';
import { createDocumentMock } from '../../../../test/utils/createDocumentMock';
import { EntityType } from 'app/entity_editor/Components/constants';
import { EditorContext } from 'app/entity_editor/EntityField/types';

jest.mock('data/CMA/ProductCatalog', () => ({
  getOrgFeature: jest.fn().mockResolvedValue(true),
  getSpaceFeature: jest.fn(),
  FEATURES: {
    PC_CONTENT_TAGS: false,
    SCHEDULED_PUBLISHING: 'ff',
  },
}));
jest.mock('app/widgets/WidgetApi/BatchingApiClient', () => ({ getBatchingApiClient: jest.fn() }));
jest.mock('access_control/AccessChecker', () => {
  const AccessChecker = jest.requireActual('access_control/AccessChecker');
  return {
    ...AccessChecker,
    can: jest.fn(),
  };
});
jest.mock('services/localeStore', () => {
  const mockInternalLocale = {
    'en-US': 'en-US',
    de: 'de-internal',
  };
  return {
    getDefaultLocale: () => ({ code: 'en' }),
    toInternalCode: (code) => mockInternalLocale[code],
  };
});

const spaceContext = {
  getId: () => 'spaceid',
  getEnvironmentId: () => 'envid',
  environment: {
    sys: {
      id: 'envid',
    },
  },
  data: {
    sys: {
      id: 'spaceid',
    },
    organization: { sys: { id: 'orgid' } },
  },
};

const createDocument = createDocumentMock().create;

const editorContext = createEditorContextMock().create() as EditorContext;

const spaceEndpoint = jest.fn();
const entity = {
  sys: {
    id: 'someid',
    type: EntityType.ENTRY,
    version: 42,
  },
};

const doc = createDocument(entity, spaceEndpoint);
spaceEndpoint.mockResolvedValue(doc.getData());

describe('When rendering editors page with no editors', () => {
  const localeData = {
    errors: {},
    focusedLocale: {
      name: 'locale name',
      // eslint-disable-next-line @typescript-eslint/camelcase
      internal_code: 'en',
      code: 'en',
      fallbackCode: 'en',
      default: true,
      contentManagementApi: true,
      contentDeliveryApi: true,
      optional: false,
      sys: {
        id: 'localeid',
      },
    },
    isSingleLocaleModeOn: true,
    defaultLocale: {
      name: 'locale name',
      // eslint-disable-next-line @typescript-eslint/camelcase
      internal_code: 'en',
      code: 'en',
      fallbackCode: 'en',
      default: true,
      contentManagementApi: true,
      contentDeliveryApi: true,
      optional: false,
      sys: {
        id: 'localeid',
      },
    },

    privateLocales: [],
    isLocaleActive: () => true,
  };

  const props = {
    title: 'my workbench',
    localeData,
    entityInfo: {
      id: 'someid',
      type: EntityType.ENTRY,
      name: 'nice one',
      contentType: {
        name: 'name',
      },
    },
    entryActions: {},
    loadEvents: {},
    state: {
      delete: {},
    },
    getSpace: () => spaceContext,
    statusNotificationProps: { entityLabel: 'entry', status: 'cool' },
    getOtDoc: () => doc,
    getEditorData: jest.fn(),
    editorContext,
    entrySidebarProps: {
      isMasterEnvironment: true,
      isEntry: true,
      emitter: { emit: jest.fn(), off: jest.fn(), on: jest.fn() },
      makeSidebarWidgetSDK: jest.fn(),
      localeData,
      entityInfo: {
        id: 'ididid',
        contentType: {
          name: 'name',
        },
      },
    },
    preferences: { showDisabledFields: false },
    fields: {},
    noLocalizedFieldsAdviceProps: {},
  };

  it('renders the warning', () => {
    props.getEditorData.mockReturnValue({
      editorsExtensions: [],
      fieldControls: { form: [], all: [] },
      entity: {
        data: {},
      },
    });
    render(<EntryEditorWorkbench {...props} />);
    screen.getByText(/Editing is disabled/);
  });
});
