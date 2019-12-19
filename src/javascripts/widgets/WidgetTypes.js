import { get } from 'lodash';

import { NAMESPACE_EXTENSION } from './WidgetNamespaces';
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
    isApp: false,
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
    id: appInstallation.sys.widgetId,
    namespace: NAMESPACE_EXTENSION, // TODO: should be NAMESPACE_APP
    appDefinitionId: appDefinition.sys.id,
    name: title,
    fieldTypes: (appDefinition.fieldTypes || []).map(toInternalFieldType),
    isApp: true,
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
