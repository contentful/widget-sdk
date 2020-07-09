import {
    WidgetLoader,
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
const get = jest.fn((path) => {
    if (path.includes('extensions')) {
        return Promise.resolve({ items: [] });
    }
    if (path.includes('app_installations')) {
        return Promise.resolve({ items: [], includes: { AppDefinition: [] } });
    }
});

const mockClient = {
    raw: {
        get,
    },
};

const Something: any = jest.genMockFromModule('./marketplace-data-provider');
const mockDataProvider = new Something.default();
const spaceId = 'spaceid';
const envId = 'envId';

describe('Loader', () => {
    let loader: WidgetLoader;
    beforeEach(() => {
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
                    expect(true).toBe(true);
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
                    expect(true).toBe(true);
                });
            });
        });
    });

    describe('Helpers', () => {
        describe('buildExtensionWidget', () => {
            // src doc or not
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
                            // parameters?: {
                            //     instance?: ParameterDefinition[],
                            //     installation?: ParameterDefinition[],
                            // },
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
