import { noop } from 'lodash';
import { createDialogsApi } from '../createDialogsApi';
import { createSidebarWidgetSDK } from './createSidebarWidgetSDK';

jest.mock('../createEditorApi', () => ({ createEditorApi: jest.fn() }));
jest.mock('../createEntryApi', () => ({ createEntryApi: jest.fn() }));
jest.mock('../createUserApi', () => ({ createUserApi: jest.fn() }));
jest.mock('../createNavigatorApi', () => ({ createNavigatorApi: jest.fn() }));
jest.mock('../createSpaceApi', () => ({ createSpaceApi: jest.fn() }));
jest.mock('../createSharedEditorSDK', () => ({ createSharedEditorSDK: jest.fn() }));
jest.mock('../createBaseExtensionSdk', () => ({ createBaseExtensionSdk: jest.fn() }));
jest.mock('../createDialogsApi', () => ({ createDialogsApi: jest.fn() }));
jest.mock('features/content-tags', () => ({ createTagsRepo: jest.fn() }));
jest.mock('app/widgets/WidgetApi/BatchingApiClient', () => ({ getBatchingApiClient: jest.fn() }));
jest.mock('../createContentTypeApi', () => ({ createContentTypeApi: jest.fn() }));
jest.mock('../utils', () => ({
  createIdsApiWithoutField: jest.fn().mockReturnValue({
    user: 'a-user',
    extension: 'an-ext',
    app: 'an-app',
    space: 'a-space',
    environment: 'an-env',
    entry: 'an-entry',
    contentType: 'a-contentType',
  }),
}));

const contentType = {
  name: 'content type',
  description: 'a type of content',
  sys: { id: 'a-content-type-id', type: 'ContentType' },
  displayField: 'title',
  fields: [],
};

describe('createSidebarWidgetSDK', () => {
  it('prunes properties when creating SDK for dialogs', () => {
    createSidebarWidgetSDK({
      internalContentType: contentType,
      editorData: {},
      fieldLocaleListeners: {},
      doc: {},
      parameters: null,
      spaceContext: {
        publishedCTs: { getAllBare: noop },
        getId: () => 'a-space-id',
        getEnvironmentId: () => 'an-env-id',
        getAliasesIds: () => [],
        isMasterEnvironment: () => true,
        cma: {},
        space: { data: {} },
      },
      widgetNamespace: null,
      widgetId: 'a-widget-id',
    } as any);
    expect(createDialogsApi).toBeCalledWith({
      ids: {
        user: 'a-user',
        extension: 'an-ext',
        app: 'an-app',
        space: 'a-space',
        environment: 'an-env',
      },
      window: expect.any(Object),
    });
  });
});
