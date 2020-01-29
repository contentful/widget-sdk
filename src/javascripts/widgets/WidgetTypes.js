import { get, isPlainObject } from 'lodash';

import { NAMESPACE_EXTENSION, NAMESPACE_APP } from './WidgetNamespaces';
import { LOCATION_ENTRY_FIELD } from './WidgetLocations';
import { toInternalFieldType } from './FieldTypes';

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
    namespace: NAMESPACE_EXTENSION,
    name: extension.name,
    fieldTypes: (extension.fieldTypes || []).map(toInternalFieldType),
    sidebar: !!extension.sidebar,
    parameters: get(extension, ['parameters', 'instance'], []),
    installationParameters: {
      definitions: get(extension, ['parameters', 'installation'], []),
      values: parameters || {}
    }
  };
}

function getAppFieldTypes(appDefinition) {
  const entryFieldLocation = (appDefinition.locations || []).find(l => {
    return isPlainObject(l) && l.location === LOCATION_ENTRY_FIELD;
  });

  if (entryFieldLocation) {
    return (entryFieldLocation.fieldTypes || []).map(toInternalFieldType);
  } else {
    return [];
  }
}

export function buildAppWidget({ id, title, icon, appDefinition, appInstallation }) {
  return {
    src: appDefinition.src,
    id: appDefinition.sys.id,
    appDefinitionId: appDefinition.sys.id,
    namespace: NAMESPACE_APP,
    name: title,
    fieldTypes: getAppFieldTypes(appDefinition),
    locations: (appDefinition.locations || []).map(l => l.location),
    appId: id,
    appIconUrl: icon,
    sidebar: false,
    parameters: [],
    installationParameters: {
      definitions: [],
      values: appInstallation.parameters || {}
    }
  };
}

// Artifical widget descriptor for rendering `src`
// of `AppDefinition` BEFORE it gets installed in a space-env.
// Used only on the app configuration page for rendering both
// `LOCATION_APP_CONFIG` and `LOCATION_DIALOG`.
export function buildAppDefinitionWidget(appDefinition) {
  return {
    namespace: NAMESPACE_APP,
    id: appDefinition.sys.id,
    appDefinitionId: appDefinition.sys.id,
    src: appDefinition.src,
    parameters: [],
    installationParameters: {
      definitions: [],
      values: {}
    }
  };
}
