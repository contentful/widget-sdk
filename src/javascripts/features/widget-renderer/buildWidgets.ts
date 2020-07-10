import { Widget, Location, Extension, AppInstallation, AppDefinition } from './interfaces';
import { MarketplaceDataProvider } from './marketplace-data-provider';
import { NAMESPACE_EXTENSION, NAMESPACE_APP } from 'widgets/WidgetNamespaces';
import { get } from 'lodash';

export const buildAppWidget = (
  installation: AppInstallation,
  definition: AppDefinition,
  marketplaceDataProvider: MarketplaceDataProvider
): Widget => {
  return {
    namespace: NAMESPACE_APP,
    id: definition.sys.id,
    slug: marketplaceDataProvider.getSlug(NAMESPACE_APP, definition.sys.id),
    iconUrl: marketplaceDataProvider.getIconUrl(NAMESPACE_APP, definition.sys.id),
    name: definition.name,
    hosting: {
      type: 'src',
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

export const buildExtensionWidget = (
  extension: Extension,
  marketplaceDataProvider: MarketplaceDataProvider
): Widget => {
  const locations: Location[] = [
    {
      location: 'entry-field',
      fieldTypes: extension.extension.fieldTypes || [],
    },
    { location: 'page' },
    { location: 'entry-sidebar' },
    { location: 'entry-editor' },
    { location: 'dialog' },
  ];

  if (extension.extension.sidebar) {
    locations.push({ location: 'entry-field-sidebar' });
  }

  return {
    namespace: NAMESPACE_EXTENSION,
    id: extension.sys.id,
    slug: marketplaceDataProvider.getSlug(NAMESPACE_EXTENSION, extension.sys.id),
    iconUrl: marketplaceDataProvider.getIconUrl(NAMESPACE_EXTENSION, extension.sys.id),
    name: extension.extension.name,
    hosting: {
      type: typeof extension.sys.srcdocSha256 === 'string' ? 'srcdoc' : 'src',
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
