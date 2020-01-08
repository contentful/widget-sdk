import { get } from 'lodash';

import { NAMESPACE_EXTENSION, NAMESPACE_APP } from './WidgetNamespaces';
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

export function buildAppWidget({ id, title, icon, appDefinition, appInstallation }) {
  return {
    src: appDefinition.src,
    id: appDefinition.sys.id,
    appDefinitionId: appDefinition.sys.id,
    // TODO: figure out how to get rid of it. See `ExtensionAPI`.
    legacyAppExtensionWidgetId: appInstallation.sys.widgetId,
    namespace: NAMESPACE_APP,
    name: title,
    fieldTypes: (appDefinition.fieldTypes || []).map(toInternalFieldType),
    appId: id,
    appIconUrl: icon,
    sidebar: false,
    locations: appDefinition.locations,
    parameters: [],
    installationParameters: {
      definitions: [],
      values: appInstallation.parameters || {}
    }
  };
}
