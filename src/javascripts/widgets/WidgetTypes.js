import { get, isPlainObject } from 'lodash';

import { LOCATION_ENTRY_FIELD, LOCATION_PAGE } from './WidgetLocations';
import { toInternalFieldType } from './FieldTypes';
import { WidgetNamespace } from 'features/widget-renderer';

export function buildExtensionWidget({ sys, extension, parameters }) {
  // We identify srcdoc-backed extensions by taking a look
  // at `sys.srcdocSha256`. It'll be present if the Extension
  // uses `srcdoc` even if `stripSrcdoc` QS parameter was used.
  // If we know that srcdoc is used but we don't have its value
  // (due to `stripSrcdoc`) we indicate it by `true`
  const { src, srcdoc } = extension;
  const hosting = typeof sys.srcdocSha256 === 'string' ? { srcdoc: srcdoc || true } : { src };

  return {
    ...hosting,
    id: sys.id,
    namespace: WidgetNamespace.EXTENSION,
    name: extension.name,
    fieldTypes: (extension.fieldTypes || []).map(toInternalFieldType),
    sidebar: !!extension.sidebar,
    parameters: get(extension, ['parameters', 'instance'], []),
    installationParameters: {
      definitions: get(extension, ['parameters', 'installation'], []),
      values: parameters || {},
    },
  };
}

function getAppLocationData({ locations = [] }, desiredLocation) {
  return locations.filter(isPlainObject).find(({ location }) => location === desiredLocation);
}

function getAppFieldTypes(appDefinition) {
  const { fieldTypes = [] } = getAppLocationData(appDefinition, LOCATION_ENTRY_FIELD) || {};

  return fieldTypes.map(toInternalFieldType);
}

function getAppNavigationItem(appDefinition) {
  const { navigationItem } = getAppLocationData(appDefinition, LOCATION_PAGE) || {};

  return navigationItem;
}

export function buildAppWidget({ id, title, icon, appDefinition, appInstallation }) {
  return {
    src: appDefinition.src,
    id: appDefinition.sys.id,
    appDefinitionId: appDefinition.sys.id,
    namespace: WidgetNamespace.APP,
    name: title,
    fieldTypes: getAppFieldTypes(appDefinition),
    navigationItem: getAppNavigationItem(appDefinition),
    locations: (appDefinition.locations || []).map((l) => l.location),
    appId: id,
    appIconUrl: icon,
    sidebar: false,
    parameters: [],
    installationParameters: {
      definitions: [],
      values: appInstallation.parameters || {},
    },
  };
}

// Artifical widget descriptor for rendering `src`
// of `AppDefinition` BEFORE it gets installed in a space-env.
// Used only on the app configuration page for rendering both
// `LOCATION_APP_CONFIG` and `LOCATION_DIALOG`.
export function buildAppDefinitionWidget(appDefinition) {
  return {
    namespace: WidgetNamespace.APP,
    id: appDefinition.sys.id,
    appDefinitionId: appDefinition.sys.id,
    src: appDefinition.src,
    parameters: [],
    installationParameters: {
      definitions: [],
      values: {},
    },
  };
}
