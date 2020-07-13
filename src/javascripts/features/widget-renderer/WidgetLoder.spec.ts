import { WidgetLoader } from './WidgetLoader';
import {
  Extension,
  AppInstallation,
  AppDefinition,
  EditorInterface,
  WidgetNamespace,
} from './interfaces';
import { prepareAppInstallationEntity, prepareExtensionEntity } from './apiMocks';

const spaceId = 'spaceid';
const envId = 'envId';

describe('Loader', () => {
  let loader: WidgetLoader;
  let get: jest.Mock;
  let onWarning: jest.Mock;
  let mockClient: any;
  let mockDataProvider: any;

  const mockGet = (
    extensions: Extension[],
    installations: AppInstallation[],
    definitions: AppDefinition[]
  ) => {
    get.mockImplementation((path) => {
      if (path === `/spaces/${spaceId}/environments/${envId}/extensions`) {
        return Promise.resolve({ items: extensions });
      } else if (path === `/spaces/${spaceId}/environments/${envId}/app_installations`) {
        return Promise.resolve({
          items: installations,
          includes: { AppDefinition: definitions },
        });
      } else {
        throw new Error(`get received an unexpected path: ${path}`);
      }
    });
  };

  beforeEach(() => {
    mockDataProvider = {
      prefetch: jest.fn().mockResolvedValue(undefined),
      getSlug: jest.fn(),
      getIconUrl: jest.fn(),
    };

    get = jest.fn();
    mockGet([], [], []);
    mockClient = { raw: { get } };

    onWarning = jest.fn();

    loader = new WidgetLoader(mockClient, mockDataProvider, spaceId, envId, onWarning);
  });

  describe('Public interface', () => {
    describe('Warmup', () => {
      it('prefetchs marketplace data', async () => {
        await loader.warmUp({ widgetNamespace: WidgetNamespace.EXTENSION, widgetId: 'my_id' });
        expect(mockDataProvider.prefetch).toHaveBeenCalledTimes(1);
      });

      it('reports warnings', async () => {
        const err = new Error('500');
        mockDataProvider.prefetch.mockRejectedValueOnce(err);

        await loader.warmUp({ widgetNamespace: WidgetNamespace.APP, widgetId: 'test' });

        expect(onWarning).toHaveBeenCalledTimes(1);
        expect(onWarning).toHaveBeenCalledWith({
          message: 'Failed to load marketplace data',
          fallbackRes: undefined,
          ids: ['test'],
          err,
        });
      });

      describe('for Apps', () => {
        it('fetches data for that widget', async () => {
          await loader.warmUp({ widgetNamespace: WidgetNamespace.APP, widgetId: 'my_id' });
          expect(get).toHaveBeenCalledTimes(1);
          expect(get).toHaveBeenCalledWith(
            `/spaces/${spaceId}/environments/${envId}/app_installations`
          );
        });
      });

      describe(`for extensions`, () => {
        it('fetches data for that widget', async () => {
          await loader.warmUp({ widgetNamespace: WidgetNamespace.EXTENSION, widgetId: 'my_id' });
          expect(get).toHaveBeenCalledTimes(1);
          expect(get).toHaveBeenCalledWith(`/spaces/${spaceId}/environments/${envId}/extensions`, {
            params: {
              'sys.id[in]': 'my_id',
            },
          });
        });
      });
    });

    describe('warmUpWithEditorInterface', () => {
      describe('with editor', () => {
        it('warms up the correct widgets', async () => {
          const editorInterface: EditorInterface = {
            sys: {
              type: 'EditorInterface',
              contentType: {
                sys: {
                  type: 'Link',
                  linkType: 'ContentType',
                  id: 'id',
                },
              },
            },
            controls: [{ fieldId: 'foo', widgetNamespace: undefined, widgetId: 'my_control' }],
            sidebar: [{ widgetNamespace: WidgetNamespace.EXTENSION, widgetId: 'my_extension' }],
            editor: { widgetNamespace: WidgetNamespace.APP, widgetId: 'myapp' },
          };

          await loader.warmUpWithEditorInterface(editorInterface);

          expect(mockDataProvider.prefetch).toHaveBeenCalledTimes(1);

          expect(get).toHaveBeenCalledTimes(2);

          expect(get).toHaveBeenCalledWith(
            `/spaces/${spaceId}/environments/${envId}/app_installations`
          );

          expect(get).toHaveBeenCalledWith(`/spaces/${spaceId}/environments/${envId}/extensions`, {
            params: {
              'sys.id[in]': 'my_extension,my_control',
            },
          });
        });
      });
      describe('with editors', () => {
        it('warms up the correct widgets', async () => {
          const editorInterface: EditorInterface = {
            sys: {
              type: 'EditorInterface',
              contentType: {
                sys: {
                  type: 'Link',
                  linkType: 'ContentType',
                  id: 'id',
                },
              },
            },
            controls: [{ fieldId: 'foo', widgetNamespace: undefined, widgetId: 'my_control' }],
            sidebar: [{ widgetNamespace: WidgetNamespace.EXTENSION, widgetId: 'my_extension' }],
            editors: [{ widgetNamespace: WidgetNamespace.APP, widgetId: 'myapp' }],
          };

          await loader.warmUpWithEditorInterface(editorInterface);

          expect(mockDataProvider.prefetch).toHaveBeenCalledTimes(1);

          expect(get).toHaveBeenCalledTimes(2);

          expect(get).toHaveBeenCalledWith(
            `/spaces/${spaceId}/environments/${envId}/app_installations`
          );

          expect(get).toHaveBeenCalledWith(`/spaces/${spaceId}/environments/${envId}/extensions`, {
            params: {
              'sys.id[in]': 'my_extension,my_control',
            },
          });
        });
      });
    });

    describe('getOne', () => {
      it('returns a formatted version of the app', async () => {
        const appId = 'myapp';

        const [appInstallation, appDefinition] = prepareAppInstallationEntity(appId);

        mockGet([], [appInstallation], [appDefinition]);

        const result = await loader.getOne({
          widgetNamespace: WidgetNamespace.APP,
          widgetId: appId,
        });

        expect(result?.id).toEqual(appId);
        expect(result?.namespace).toEqual(WidgetNamespace.APP);
      });
    });

    describe('getWithEditorInterface', () => {
      it('returns a formatted version of the widgets', async () => {
        const appId = 'myapp';
        const extensionId = 'myextension';
        const controlId = 'mycontrol';

        const [appInstallationOne, appDefinitionOne] = prepareAppInstallationEntity(appId);
        const [appInstallationTwo, appDefinitionTwo] = prepareAppInstallationEntity(controlId);
        const [extension] = prepareExtensionEntity(extensionId);

        mockGet(
          [extension],
          [appInstallationOne, appInstallationTwo],
          [appDefinitionOne, appDefinitionTwo]
        );

        const editorInterface: EditorInterface = {
          sys: {
            type: 'EditorInterface',
            contentType: {
              sys: {
                type: 'Link',
                linkType: 'ContentType',
                id: 'id',
              },
            },
          },
          controls: [{ fieldId: 'foo', widgetNamespace: undefined, widgetId: controlId }],
          sidebar: [{ widgetNamespace: WidgetNamespace.EXTENSION, widgetId: extensionId }],
          editor: { widgetNamespace: WidgetNamespace.APP, widgetId: appId },
        };

        const result = await loader.getWithEditorInterface(editorInterface);

        expect(result.map(({ id }) => id).sort()).toEqual([extensionId, appId, controlId].sort());
      });
    });

    describe('getMultiple', () => {
      it('returns a formatted version of the widgets', async () => {
        const appId = 'myapp';
        const extensionId = 'myextension';

        const [appInstallation, appDefinition] = prepareAppInstallationEntity(appId);
        const [extension] = prepareExtensionEntity(extensionId);

        mockGet([extension], [appInstallation], [appDefinition]);

        const result = await loader.getMultiple([
          { widgetNamespace: WidgetNamespace.EXTENSION, widgetId: extensionId },
          { widgetNamespace: WidgetNamespace.APP, widgetId: appId },
        ]);

        expect(result.map(({ id }) => id).sort()).toEqual([extensionId, appId].sort());
      });
    });

    describe('when get is called after warmup', () => {
      it('only fetches data once', async () => {
        await loader.warmUp({ widgetNamespace: WidgetNamespace.EXTENSION, widgetId: 'my_id' });
        await loader.getOne({ widgetNamespace: WidgetNamespace.EXTENSION, widgetId: 'my_id' });

        expect(mockDataProvider.prefetch).toHaveBeenCalledTimes(1);

        expect(get).toHaveBeenCalledTimes(1);

        expect(get).toHaveBeenCalledWith(`/spaces/${spaceId}/environments/${envId}/extensions`, {
          params: {
            'sys.id[in]': 'my_id',
          },
        });
      });
    });

    describe('When evict is called on a loaded entitiy', () => {
      it('clears the data', async () => {
        await loader.warmUp({ widgetNamespace: WidgetNamespace.EXTENSION, widgetId: 'my_id' });
        loader.evict({ widgetNamespace: WidgetNamespace.EXTENSION, widgetId: 'my_id' });
        await loader.getOne({ widgetNamespace: WidgetNamespace.EXTENSION, widgetId: 'my_id' });

        expect(get).toHaveBeenCalledTimes(2);
        expect(get).toHaveBeenNthCalledWith(
          2,
          `/spaces/${spaceId}/environments/${envId}/extensions`,
          {
            params: {
              'sys.id[in]': 'my_id',
            },
          }
        );
      });
    });

    describe('purge', () => {
      it('clears all data', async () => {
        await loader.warmUp({ widgetNamespace: WidgetNamespace.EXTENSION, widgetId: 'my_id' });
        await loader.warmUp({
          widgetNamespace: WidgetNamespace.EXTENSION,
          widgetId: 'different_id',
        });
        loader.purge();
        await loader.getOne({ widgetNamespace: WidgetNamespace.EXTENSION, widgetId: 'my_id' });
        await loader.getOne({
          widgetNamespace: WidgetNamespace.EXTENSION,
          widgetId: 'different_id',
        });

        expect(get).toHaveBeenCalledTimes(4);
        expect(get).toHaveBeenNthCalledWith(
          3,
          `/spaces/${spaceId}/environments/${envId}/extensions`,
          {
            params: {
              'sys.id[in]': 'my_id',
            },
          }
        );
        expect(get).toHaveBeenNthCalledWith(
          4,
          `/spaces/${spaceId}/environments/${envId}/extensions`,
          {
            params: {
              'sys.id[in]': 'different_id',
            },
          }
        );
      });
    });
  });
});
