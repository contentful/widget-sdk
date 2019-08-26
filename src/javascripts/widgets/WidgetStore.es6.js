import { get, uniq, identity } from 'lodash';
import { create as createBuiltinWidgetList } from './BuiltinWidgets.es6';
import { toInternalFieldType } from './FieldTypes.es6';
import { NAMESPACE_BUILTIN, NAMESPACE_EXTENSION } from './WidgetNamespaces.es6';

export function getBuiltinsOnly() {
  return {
    [NAMESPACE_BUILTIN]: createBuiltinWidgetList()
  };
}

export async function getForContentTypeManagement(extensionLoader, appsRepo) {
  const [extensions, appsListing] = await Promise.all([
    extensionLoader.getAllExtensionsForListing(),
    appsRepo.getAppsListing()
  ]);

  const apps = Object.keys(appsListing)
    .map(key => ({
      definitionId: get(appsListing[key], ['fields', 'extensionDefinitionId']),
      appId: get(appsListing[key], ['fields', 'slug']),
      icon: get(appsListing[key], ['fields', 'icon', 'fields', 'file', 'url'])
    }))
    .filter(({ definitionId }) => typeof definitionId === 'string' && definitionId.length > 0);

  return {
    [NAMESPACE_BUILTIN]: createBuiltinWidgetList(),
    [NAMESPACE_EXTENSION]: extensions.map(extension => buildExtensionWidget(extension, apps))
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
    [NAMESPACE_EXTENSION]: extensions.map(extension => buildExtensionWidget(extension, []))
  };
}

function buildExtensionWidget({ sys, extension, extensionDefinition, parameters }, apps) {
  const { src, srcdoc } = extension;

  // We identify srcdoc-backed extensions by taking a look
  // at `sys.srcdocSha256`. It'll be present if the Extension
  // uses `srcdoc` even if `stripSrcdoc` QS paramter was used.
  // If we know that srcdoc is used but we don't have its value
  // (due to `stripSrcdoc`) we indicate it by `true`
  const base = typeof sys.srcdocSha256 === 'string' ? { srcdoc: srcdoc || true } : { src };
  const extensionDefinitionId = get(extensionDefinition, ['sys', 'id']);
  const app = apps.find(app => app.definitionId === extensionDefinitionId);

  return {
    ...base,
    id: sys.id,
    extensionDefinitionId,
    name: extension.name,
    fieldTypes: (extension.fieldTypes || []).map(toInternalFieldType),
    isApp: !!app,
    appId: get(app, 'appId'),
    appIconUrl: get(app, 'icon'),
    sidebar: extension.sidebar,
    parameters: get(extension, ['parameters', 'instance'], []),
    installationParameters: {
      definitions: get(extension, ['parameters', 'installation'], []),
      values: parameters || {}
    }
  };
}
