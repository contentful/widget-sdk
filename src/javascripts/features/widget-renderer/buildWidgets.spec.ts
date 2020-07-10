import { buildExtensionWidget, buildAppWidget } from './buildWidgets';
import { ParameterDefinition, Extension, AppInstallation, AppDefinition } from './interfaces';

// TODO: Deduplicate this, as it also exists in loader.spec.ts.
// Not sure where the appropriate place would be though.
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
