import {
  AppDefinition,
  AppInstallation,
  Extension,
  ParameterDefinition,
  WidgetLocation,
} from './interfaces';

export const prepareAppInstallationEntity = (id: string): [AppInstallation, AppDefinition] => {
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
    parameters: {
      hello: 'world',
    },
  };

  const appDefinition: AppDefinition = {
    sys: {
      type: 'AppDefinition',
      id,
    },
    name: 'myapp',
    src: 'https://example.com',
    locations: [{ location: WidgetLocation.APP_CONFIG }],
  };

  return [appInstallation, appDefinition];
};

export const prepareExtensionEntity = (id: string): [Extension, ParameterDefinition] => {
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
        installation: [parameterDefinition],
      },
    },
    parameters: { exampleparameter: true },
  };

  return [extension, parameterDefinition];
};
