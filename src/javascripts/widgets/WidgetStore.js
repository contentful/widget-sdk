import { uniq, identity } from 'lodash';
import { create as createBuiltinWidgetList } from './BuiltinWidgets';
import { NAMESPACE_BUILTIN, NAMESPACE_EXTENSION } from './WidgetNamespaces';
import { getCustomWidgetLoader } from './CustomWidgetLoaderInstance';

// TODO: rename this module to "WidgetProvider".

export async function getForEditor(editorInterface = {}) {
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

  const customWidgetLoader = getCustomWidgetLoader();
  const extensionWidgets = await customWidgetLoader.getByIds(uniq(extensionIds));

  return {
    [NAMESPACE_BUILTIN]: createBuiltinWidgetList(),
    [NAMESPACE_EXTENSION]: extensionWidgets
  };
}
