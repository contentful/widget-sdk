import {
  Widget,
  Location,
  Extension,
  AppInstallation,
  AppDefinition,
  HostingType,
  WidgetNamespace,
  WidgetLocation,
} from './interfaces';
import { MarketplaceDataProvider } from './MarketplaceDataProvider';
import { get } from 'lodash';

export const buildAppWidget = (
  installation: AppInstallation,
  definition: AppDefinition,
  marketplaceDataProvider: MarketplaceDataProvider
): Widget => {
  return {
    namespace: WidgetNamespace.APP,
    id: definition.sys.id,
    slug: marketplaceDataProvider.getSlug(WidgetNamespace.APP, definition.sys.id),
    iconUrl: marketplaceDataProvider.getIconUrl(WidgetNamespace.APP, definition.sys.id),
    name: definition.name,
    hosting: {
      type: HostingType.SRC,
      value: definition.src!,
    },
    parameters: {
      definitions: {
        instance: [],
        installation: [],
      },
      values: {
        installation:
          typeof installation.parameters === 'undefined' ? {} : installation.parameters!,
      },
    },
    locations: definition.locations || [],
  };
};

// Creates a widget only using the AppDefinition entity.
// Used when rendering the configuration screen since
// AppInstallation may not exist at the moment.
export const buildAppDefinitionWidget = (
  definition: AppDefinition,
  marketplaceDataProvider: MarketplaceDataProvider
): Widget => {
  return buildAppWidget({} as AppInstallation, definition, marketplaceDataProvider);
};

export const buildExtensionWidget = (
  extension: Extension,
  marketplaceDataProvider: MarketplaceDataProvider
): Widget => {
  const locations: Location[] = [
    {
      location: WidgetLocation.ENTRY_FIELD,
      fieldTypes: extension.extension.fieldTypes || [],
    },
    { location: WidgetLocation.PAGE },
    { location: WidgetLocation.ENTRY_SIDEBAR },
    { location: WidgetLocation.ENTRY_EDITOR },
    { location: WidgetLocation.DIALOG },
  ];

  if (extension.extension.sidebar) {
    locations.push({ location: WidgetLocation.ENTRY_FIELD_SIDEBAR });
  }

  return {
    namespace: WidgetNamespace.EXTENSION,
    id: extension.sys.id,
    slug: marketplaceDataProvider.getSlug(WidgetNamespace.EXTENSION, extension.sys.id),
    iconUrl: marketplaceDataProvider.getIconUrl(WidgetNamespace.EXTENSION, extension.sys.id),
    name: extension.extension.name,
    hosting: {
      type: typeof extension.sys.srcdocSha256 === 'string' ? HostingType.SRCDOC : HostingType.SRC,
      value: extension.extension.src || extension.extension.srcdoc!,
    },
    parameters: {
      definitions: {
        instance: get(extension, ['extension', 'parameters', 'instance'], []),
        installation: get(extension, ['extension', 'parameters', 'installation'], []),
      },
      values: {
        installation: extension.parameters || {},
      },
    },
    locations,
  };
};
