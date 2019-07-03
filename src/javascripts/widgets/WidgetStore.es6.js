import { get, uniq } from 'lodash';
import { create as createBuiltinWidgetList } from './BuiltinWidgets.es6';
import { toInternalFieldType } from './FieldTypes.es6';
import { NAMESPACE_BUILTIN, NAMESPACE_EXTENSION } from './WidgetNamespaces.es6';

export function getBuiltinsOnly() {
  return {
    [NAMESPACE_BUILTIN]: createBuiltinWidgetList()
  };
}

export async function getForContentTypeManagement(extensionLoader) {
  const extensions = await extensionLoader.getAllExtensions();

  return {
    [NAMESPACE_BUILTIN]: createBuiltinWidgetList(),
    [NAMESPACE_EXTENSION]: extensions.map(buildExtensionWidget)
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
    .map(control => control.widgetId);

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

function buildExtensionWidget(data) {
  const { src, srcdoc } = data.extension;
  const base = src ? { src } : { srcdoc };
  const fieldTypes = data.extension.fieldTypes || [];
  return {
    ...base,
    id: data.sys.id,
    name: data.extension.name,
    fieldTypes: fieldTypes.map(toInternalFieldType),
    sidebar: data.extension.sidebar,
    parameters: get(data.extension, ['parameters', 'instance'], []),
    installationParameters: {
      definitions: get(data.extension, ['parameters', 'installation'], []),
      values: data.parameters || {}
    }
  };
}
