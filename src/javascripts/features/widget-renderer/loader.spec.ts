import { WidgetLoader, EditorInterface, ClientAPI } from './loader';
import { ParameterDefinition, Extension, AppInstallation, AppDefinition } from './interfaces';

import { NAMESPACE_EXTENSION, NAMESPACE_APP } from 'widgets/WidgetNamespaces';

const spaceId = 'spaceid';
const envId = 'envId';

const buildAppInstallation = (id: string): [AppInstallation, AppDefinition] => {
  const appInstallation: AppInstallation = {
    sys: {
      type: 'AppInstallation',
      appDefinition: {
        sys: {
          type: 'Link',
          linkType: 'AppDefinition',
          id,
        },
      },
    },
  };
  const appDefinition: AppDefinition = {
    sys: {
      type: 'AppDefinition',
      id,
    },
    name: 'myapp',
    src: 'https://example.com',
    locations: [],
  };
  return [appInstallation, appDefinition];
};

const buildExtensionResponse = (id: string): [Extension, ParameterDefinition] => {
  const parameterDefinition: ParameterDefinition = {
    name: 'exampleparameter',
    id: 'exampleparameter',
    type: 'Boolean',
    required: true,
  };

  const extension: Extension = {
    sys: {
      type: 'Extension',
      id,
    },
    extension: {
      name: 'myextension',
      src: 'https://example.com',
      parameters: {
        instance: [parameterDefinition],
        // installation?: ParameterDefinition[],
      },
    },
    parameters: { exampleparameter: true },
  };

  return [extension, parameterDefinition];
};

describe('Loader', () => {
  let loader: WidgetLoader;
  let get: jest.Mock;
  let mockClient: ClientAPI;
  let mockDataProvider: any;

  const mockGet = (
    extensions: Extension[],
    installations: AppInstallation[],
    definitions: AppDefinition[]
  ) => {
    get.mockImplementation(path => {
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
      prefetch: jest.fn(),
      getSlug: jest.fn(),
      getIconUrl: jest.fn(),
    };
    get = jest.fn();
    mockGet([], [], []);

    mockClient = ({
      raw: {
        get,
      },
    } as unknown) as ClientAPI;
    loader = new WidgetLoader(mockClient, mockDataProvider, spaceId, envId);
  });

  describe('Public interface', () => {
    describe('Warmup', () => {
      it('prefetchs marketplace data', async () => {
        await loader.warmUp(NAMESPACE_EXTENSION, 'my_id');
        expect(mockDataProvider.prefetch).toHaveBeenCalledTimes(1);
      });

      describe('for Apps', () => {
        it('fetches data for that widget', async () => {
          await loader.warmUp(NAMESPACE_APP, 'my_id');
          expect(get).toHaveBeenCalledTimes(1);
          expect(get).toHaveBeenCalledWith(
            `/spaces/${spaceId}/environments/${envId}/app_installations`
          );
        });
      });

      describe(`for extensions`, () => {
        it('fetches data for that widget', async () => {
          await loader.warmUp(NAMESPACE_EXTENSION, 'my_id');
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
            controls: [{ widgetNamespace: undefined, widgetId: 'my_control' }],
            sidebar: [{ widgetNamespace: NAMESPACE_EXTENSION, widgetId: 'my_extension' }],
            editor: { widgetNamespace: NAMESPACE_APP, widgetId: 'myapp' },
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
            controls: [{ widgetNamespace: undefined, widgetId: 'my_control' }],
            sidebar: [{ widgetNamespace: NAMESPACE_EXTENSION, widgetId: 'my_extension' }],
            editors: [{ widgetNamespace: NAMESPACE_APP, widgetId: 'myapp' }],
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

        const [appInstallation, appDefinition] = buildAppInstallation(appId);

        mockGet([], [appInstallation], [appDefinition]);

        const result = await loader.getOne(NAMESPACE_APP, appId);

        expect(result?.id).toEqual(appId);
        expect(result?.namespace).toEqual(NAMESPACE_APP);
      });
    });

    describe('getWithEditorInterface', () => {
      it('returns a formatted version of the widgets', async () => {
        const appId = 'myapp';
        const extensionId = 'myextension';
        const controlId = 'mycontrol';

        const [appInstallationOne, appDefinitionOne] = buildAppInstallation(appId);
        const [appInstallationTwo, appDefinitionTwo] = buildAppInstallation(controlId);
        const [extension] = buildExtensionResponse(extensionId);

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
          controls: [{ widgetNamespace: undefined, widgetId: controlId }],
          sidebar: [{ widgetNamespace: NAMESPACE_EXTENSION, widgetId: extensionId }],
          editor: { widgetNamespace: NAMESPACE_APP, widgetId: appId },
        };

        const result = await loader.getWithEditorInterface(editorInterface);

        expect(result.map(({ id }) => id).sort()).toEqual([extensionId, appId, controlId].sort());
      });
    });

    describe('getMultiple', () => {
      it('returns a formatted version of the widgets', async () => {
        const appId = 'myapp';
        const extensionId = 'myextension';

        const [appInstallation, appDefinition] = buildAppInstallation(appId);
        const [extension] = buildExtensionResponse(extensionId);

        mockGet([extension], [appInstallation], [appDefinition]);

        const result = await loader.getMultiple([
          { widgetNamespace: NAMESPACE_EXTENSION, widgetId: extensionId },
          { widgetNamespace: NAMESPACE_APP, widgetId: appId },
        ]);

        expect(result.map(({ id }) => id).sort()).toEqual([extensionId, appId].sort());
      });
    });

    describe('when get is called after warmup', () => {
      it('only fetches data once', async () => {
        await loader.warmUp(NAMESPACE_EXTENSION, 'my_id');
        await loader.getOne(NAMESPACE_EXTENSION, 'my_id');

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
        await loader.warmUp(NAMESPACE_EXTENSION, 'my_id');
        loader.evict(NAMESPACE_EXTENSION, 'my_id');
        await loader.getOne(NAMESPACE_EXTENSION, 'my_id');

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
        await loader.warmUp(NAMESPACE_EXTENSION, 'my_id');
        await loader.warmUp(NAMESPACE_EXTENSION, 'different_id');
        loader.purge();
        await loader.getOne(NAMESPACE_EXTENSION, 'my_id');
        await loader.getOne(NAMESPACE_EXTENSION, 'different_id');

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
