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
import 'contentful-management';
import { NAMESPACE_EXTENSION, NAMESPACE_APP } from 'widgets/WidgetNamespaces';

// generate these

const Something: any = jest.genMockFromModule('./marketplace-data-provider');
const mockDataProvider = new Something.default();
const spaceId = 'spaceid';
const envId = 'envId';

describe('Loader', () => {
    let loader: WidgetLoader;
    let get;
    let mockClient;
    beforeEach(() => {
        get = jest.fn((path) => {
            if (path.includes('extensions')) {
                return Promise.resolve({ items: [] });
            }
            if (path.includes('app_installations')) {
                return Promise.resolve({ items: [], includes: { AppDefinition: [] } });
            }
        });

        mockClient = {
            raw: {
                get,
            },
        };
        loader = new WidgetLoader(
            (mockClient as unknown) as ClientAPI,
            mockDataProvider,
            spaceId,
            envId
        );
    });
    describe('Public interface', () => {
        describe('Warmup', () => {
            // are these tests to tied to the implementation?
            // would be nice if I could just test the output of the load function
            it('prefetchs marketplace data', async () => {
                await loader.warmUp(NAMESPACE_EXTENSION, 'my_id');
                expect(mockDataProvider.prefetch).toHaveBeenCalled();
            });
            describe(`for Apps`, () => {
                it('fetches data for that widget', async () => {
                    await loader.warmUp(NAMESPACE_APP, 'my_id');
                    expect(get).toHaveBeenCalledWith(
                        `/spaces/${spaceId}/environments/${envId}/app_installations`
                    );
                });
            });
            describe(`for extensions`, () => {
                it('fetches data for that widget', async () => {
                    await loader.warmUp(NAMESPACE_EXTENSION, 'my_id');
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
                    // loader.load = jest.fn();
                    await loader.warmUpWithEditorInterface(editorInterface);
                    expect(mockDataProvider.prefetch).toHaveBeenCalled();
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
                    // loader.load = jest.fn();
                    await loader.warmUpWithEditorInterface(editorInterface);
                    expect(mockDataProvider.prefetch).toHaveBeenCalled();
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
                const appInstallation: AppInstallation = {
                    sys: {
                        type: 'AppInstallation',
                        appDefinition: {
                            sys: {
                                type: 'Link',
                                linkType: 'AppDefinition',
                                id: appId,
                            },
                        },
                    },
                };
                const appDefinition: AppDefinition = {
                    sys: {
                        type: 'AppDefinition',
                        id: appId,
                    },
                    name: 'myapp',
                    src: 'https://example.com',
                    locations: [],
                };

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
        // describe('getWithEditorInterface');
        // describe('getMultiple');
        // describe('evict');
        // describe('purge');
    });

    describe('Helpers', () => {
        describe('buildExtensionWidget', () => {
            describe('with src', () => {
                it('builds a widget from extension data', () => {
                    const parameterDefinition: ParameterDefinition = {
                        name: 'exampleparameter',
                        id: 'exampleparameter',
                        type: 'Boolean',
                        required: true,
                    };

                    const extension: Extension = {
                        sys: {
                            type: 'Extension',
                            id: 'myextension',
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
