import { buildExtensionWidget, buildAppWidget } from './buildWidgets';
import { Extension, HostingType, WidgetLocation, WidgetNamespace } from './interfaces';
import { prepareExtensionEntity, prepareAppInstallationEntity } from './apiMocks';

describe('buildExtensionWidget', () => {
  let mockDataProvider: any;

  beforeEach(() => {
    mockDataProvider = {
      prefetch: jest.fn(),
      getSlug: jest.fn(),
      getIconUrl: jest.fn(),
    };
  });

  describe('with src', () => {
    it('builds a widget from extension data', () => {
      const [extension, parameterDefinition] = prepareExtensionEntity('myextension');

      mockDataProvider.getSlug.mockReturnValue('a_nice_slug');
      mockDataProvider.getIconUrl.mockReturnValue('url');

      expect(buildExtensionWidget(extension, mockDataProvider)).toEqual({
        hosting: {
          type: HostingType.SRC,
          value: 'https://example.com',
        },
        iconUrl: 'url',
        id: 'myextension',
        locations: [
          {
            fieldTypes: [],
            location: WidgetLocation.ENTRY_FIELD,
          },
          {
            location: WidgetLocation.PAGE,
          },
          {
            location: WidgetLocation.ENTRY_SIDEBAR,
          },
          {
            location: WidgetLocation.ENTRY_EDITOR,
          },
          {
            location: WidgetLocation.DIALOG,
          },
        ],
        name: 'myextension',
        namespace: WidgetNamespace.EXTENSION,
        parameters: {
          definitions: {
            installation: [parameterDefinition],
            instance: [],
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
      };

      mockDataProvider.getSlug.mockReturnValue('a_nice_slug');
      mockDataProvider.getIconUrl.mockReturnValue('url');

      expect(buildExtensionWidget(extension, mockDataProvider)).toEqual({
        hosting: {
          type: HostingType.SRCDOC,
          value: '<html>a nice html page</html>',
        },
        iconUrl: 'url',
        id: 'myextension',
        locations: [
          {
            fieldTypes: [],
            location: WidgetLocation.ENTRY_FIELD,
          },
          {
            location: WidgetLocation.PAGE,
          },
          {
            location: WidgetLocation.ENTRY_SIDEBAR,
          },
          {
            location: WidgetLocation.ENTRY_EDITOR,
          },
          {
            location: WidgetLocation.DIALOG,
          },
        ],
        name: 'myextension',
        namespace: WidgetNamespace.EXTENSION,
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

  describe('buildAppWidget', () => {
    it('builds a widget from app data', () => {
      const [appInstallation, appDefinition] = prepareAppInstallationEntity('myapp');

      mockDataProvider.getSlug.mockReturnValue('a_nice_slug');
      mockDataProvider.getIconUrl.mockReturnValue('url');

      expect(buildAppWidget(appInstallation, appDefinition, mockDataProvider)).toEqual({
        hosting: {
          type: HostingType.SRC,
          value: 'https://example.com',
        },
        iconUrl: 'url',
        id: 'myapp',
        locations: [{ location: WidgetLocation.APP_CONFIG }],
        name: 'myapp',
        namespace: WidgetNamespace.APP,
        parameters: {
          definitions: {
            installation: [],
            instance: [],
          },
          values: {
            installation: {
              hello: 'world',
            },
          },
        },
        slug: 'a_nice_slug',
      });
    });
  });
});
