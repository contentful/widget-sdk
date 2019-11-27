import { get, uniq, identity } from 'lodash';
import { create as createBuiltinWidgetList } from './BuiltinWidgets';
import { toInternalFieldType } from './FieldTypes';
import { NAMESPACE_BUILTIN, NAMESPACE_EXTENSION } from './WidgetNamespaces';

export function getBuiltinsOnly() {
  return {
    [NAMESPACE_BUILTIN]: createBuiltinWidgetList()
  };
}

export async function getForContentTypeManagement(cma, appsRepo) {
  const [{ items: extensions }, apps] = await Promise.all([
    cma.getExtensionsForListing(),
    appsRepo.getApps().catch(() => []) // Don't crash if apps are not available.
  ]);

  const extensionWidgets = extensions.filter(e => !!e.extension).map(buildExtensionWidget);
  const appWidgets = apps.filter(app => !!app.appInstallation).map(buildAppWidget);

  return {
    [NAMESPACE_BUILTIN]: createBuiltinWidgetList(),
    [NAMESPACE_EXTENSION]: extensionWidgets.concat(appWidgets)
  };
}

export async function getForEditor(extensionLoader, editorInterface = {}) {
  const editorExtensionIds = (editorInterface.controls || [])
    .filter(control => {
      // Due to backwards compatibility `widgetNamespace` is not
      // required in `controls`. It means that if the namespace
      // is not explicitly set to `builtin` we need to treat a control
      // as something that points to an extension. Loader handles
      // this scenario gracefully.
      return control.widgetNamespace !== NAMESPACE_BUILTIN;
    })
    .map(control => control.widgetId)
    // `widgetId` is not required in `controls`, we use a builtin default if not provided.
    .filter(identity);

  const sidebarExtensionIds = (editorInterface.sidebar || [])
    .filter(sidebarItem => {
      // On the other hand, since custom sidebars are a new thing,
      // they require to have the `widgetNamespace` defined. Thanks
      // to that we can only pick IDs from the `extension` namespace.
      return sidebarItem.widgetNamespace === NAMESPACE_EXTENSION;
    })
    .map(sidebarItem => sidebarItem.widgetId);

  const extensionIds = editorExtensionIds.concat(sidebarExtensionIds);

  if (editorInterface.editor && editorInterface.editor.widgetNamespace === NAMESPACE_EXTENSION) {
    extensionIds.push(editorInterface.editor.widgetId);
  }

  const extensions = await extensionLoader.getExtensionsById(uniq(extensionIds));

  return {
    [NAMESPACE_BUILTIN]: createBuiltinWidgetList(),
    [NAMESPACE_EXTENSION]: extensions.map(buildExtensionWidget)
  };
}

export async function getForSingleExtension(extensionLoader, extensionId) {
  const [extension] = await extensionLoader.getExtensionsById([extensionId]);

  return extension ? buildExtensionWidget(extension) : null;
}

function buildExtensionWidget({ sys, extension, parameters }) {
  // We identify srcdoc-backed extensions by taking a look
  // at `sys.srcdocSha256`. It'll be present if the Extension
  // uses `srcdoc` even if `stripSrcdoc` QS paramter was used.
  // If we know that srcdoc is used but we don't have its value
  // (due to `stripSrcdoc`) we indicate it by `true`
  const { src, srcdoc } = extension;
  const hosting = typeof sys.srcdocSha256 === 'string' ? { srcdoc: srcdoc || true } : { src };

  return {
    ...hosting,
    id: sys.id,
    name: extension.name,
    fieldTypes: (extension.fieldTypes || []).map(toInternalFieldType),
    isApp: false,
    sidebar: extension.sidebar,
    locations: extension.locations,
    parameters: get(extension, ['parameters', 'instance'], []),
    installationParameters: {
      definitions: get(extension, ['parameters', 'installation'], []),
      values: parameters || {}
    }
  };
}

function buildAppWidget({ id, title, icon, appDefinition, appInstallation }) {
  return {
    src: appDefinition.src,
    id: appInstallation.sys.widgetId,
    appDefinitionId: appDefinition.sys.id,
    name: title,
    fieldTypes: (appDefinition.fieldTypes || []).map(toInternalFieldType),
    isApp: true,
    appId: id,
    appIconUrl: icon,
    locations: appDefinition.locations,
    parameters: [],
    installationParameters: {
      definitions: [],
      values: appInstallation.parameters
    }
  };
}
