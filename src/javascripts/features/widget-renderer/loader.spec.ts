import {
  WidgetLoader,
  EditorInterface,
  ClientAPI,
  buildAppWidget,
  buildExtensionWidget,
  AppInstallation,
  AppDefinition,
  Extension,
} from './loader';
import { ParameterDefinition } from './interfaces';
import { NAMESPACE_EXTENSION, NAMESPACE_APP } from 'widgets/WidgetNamespaces';

const spaceId = 'spaceid';
const envId = 'envId';

const buildAppInstallation = (id: string): any => {
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

const buildExtensionResponse = (id: string): any => {
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

  beforeEach(() => {
    mockDataProvider = {
      prefetch: jest.fn(),
      getSlug: jest.fn(),
      getIconUrl: jest.fn(),
    };
    get = jest.fn((path) => {
      if (path.includes('extensions')) {
        return Promise.resolve({ items: [] });
      }
      if (path.includes('app_installations')) {
        return Promise.resolve({ items: [], includes: { AppDefinition: [] } });
      }
    });

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

      describe(`for Apps`, () => {
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

        get.mockImplementation((path) => {
          if (path.includes('extensions')) {
            return Promise.resolve({ items: [] });
          }
          if (path.includes('app_installations')) {
            return Promise.resolve({
              items: [appInstallation],
              includes: { AppDefinition: [appDefinition] },
            });
          }
        });

        const result = await loader.getOne(NAMESPACE_APP, appId);

        expect(result?.id).toEqual(appId);
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

        get.mockImplementation((path) => {
          if (path.includes('extensions')) {
            return Promise.resolve({ items: [extension] });
          }
          if (path.includes('app_installations')) {
            return Promise.resolve({
              items: [appInstallationOne, appInstallationTwo],
              includes: { AppDefinition: [appDefinitionOne, appDefinitionTwo] },
            });
          }
        });

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

        expect(result.map(({ id }) => id)).toEqual([extensionId, appId, controlId]);
      });
    });

    describe('getMultiple', () => {
      it('returns a formatted version of the widgets', async () => {
        const appId = 'myapp';
        const extensionId = 'myextension';

        const [appInstallation, appDefinition] = buildAppInstallation(appId);
        const [extension] = buildExtensionResponse(extensionId);

        get.mockImplementation((path) => {
          if (path.includes('extensions')) {
            return Promise.resolve({ items: [extension] });
          }
          if (path.includes('app_installations')) {
            return Promise.resolve({
              items: [appInstallation],
              includes: { AppDefinition: [appDefinition] },
            });
          }
        });

        const result = await loader.getMultiple([
          { widgetNamespace: NAMESPACE_EXTENSION, widgetId: extensionId },
          { widgetNamespace: NAMESPACE_APP, widgetId: appId },
        ]);

        expect(result.map(({ id }) => id)).toEqual([extensionId, appId]);
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

  describe('Helpers', () => {
    describe('buildExtensionWidget', () => {
      describe('with src', () => {
        it('builds a widget from extension data', () => {
          const [extension, parameterDefinition] = buildExtensionResponse('myextension');

          mockDataProvider.getSlug.mockReturnValue('a_nice_slug');
          mockDataProvider.getIconUrl.mockReturnValue('url');

          expect(buildExtensionWidget(extension, mockDataProvider)).toEqual({
            hosting: {
              type: 'src',
              value: 'https://example.com',
            },
            iconUrl: 'url',
            id: 'myextension',
            locations: [
              {
                fieldTypes: [],
                location: 'entry-field',
              },
              {
                location: 'page',
              },
              {
                location: 'entry-sidebar',
              },
              {
                location: 'entry-editor',
              },
              {
                location: 'dialog',
              },
            ],
            name: 'myextension',
            namespace: 'extension',
            parameters: {
              definitions: {
                installation: [],
                instance: [parameterDefinition],
              },
              values: {
                installation: {
                  exampleparameter: true,
                },
              },
            },
            slug: 'a_nice_slug',
          });
        });
      });

      describe('with srcdoc', () => {
        it('builds a widget from extension data', () => {
          const extension: Extension = {
            sys: {
              type: 'Extension',
              id: 'myextension',
              srcdocSha256: 'arealgenuinesha',
            },
            extension: {
              name: 'myextension',
              srcdoc: '<html>a nice html page</html>',
            },
            parameters: { myParam: 'hello' },
          };
          mockDataProvider.getSlug.mockReturnValue('a_nice_slug');
          mockDataProvider.getIconUrl.mockReturnValue('url');

          expect(buildExtensionWidget(extension, mockDataProvider)).toEqual({
            hosting: {
              type: 'srcdoc',
              value: '<html>a nice html page</html>',
            },
            iconUrl: 'url',
            id: 'myextension',
            locations: [
              {
                fieldTypes: [],
                location: 'entry-field',
              },
              {
                location: 'page',
              },
              {
                location: 'entry-sidebar',
              },
              {
                location: 'entry-editor',
              },
              {
                location: 'dialog',
              },
            ],
            name: 'myextension',
            namespace: 'extension',
            parameters: {
              definitions: {
                installation: [],
                instance: [],
              },
              values: {
                installation: {
                  myParam: 'hello',
                },
              },
            },
            slug: 'a_nice_slug',
          });
        });
      });
    });

    describe('buildAppWidget', () => {
      it('builds a widget from app data', () => {
        const appInstallation: AppInstallation = {
          sys: {
            type: 'AppInstallation',
            appDefinition: {
              sys: {
                type: 'Link',
                linkType: 'AppDefinition',
                id: 'myapp',
              },
            },
          },
        };
        const appDefinition: AppDefinition = {
          sys: {
            type: 'AppDefinition',
            id: 'myapp',
          },
          name: 'myapp',
          src: 'https://example.com',
          locations: [],
        };

        mockDataProvider.getSlug.mockReturnValue('a_nice_slug');
        mockDataProvider.getIconUrl.mockReturnValue('url');

        expect(buildAppWidget(appInstallation, appDefinition, mockDataProvider)).toEqual({
          hosting: {
            type: 'src',
            value: 'https://example.com',
          },
          iconUrl: 'url',
          id: 'myapp',
          locations: [],
          name: 'myapp',
          namespace: 'app',
          parameters: {
            definitions: {
              installation: [],
              instance: [],
            },
            values: {
              installation: {},
            },
          },
          slug: 'a_nice_slug',
        });
      });
    });
  });
});
