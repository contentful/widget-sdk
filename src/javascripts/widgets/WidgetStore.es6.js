import { get } from 'lodash';
import { create as createBuiltinWidgetList } from './BuiltinWidgets.es6';
import { toInternalFieldType } from './FieldTypes.es6';
import { NAMESPACE_BUILTIN, NAMESPACE_EXTENSION } from './WidgetNamespaces.es6';

export const getBuiltinsOnly = () => {
  return { [NAMESPACE_BUILTIN]: createBuiltinWidgetList() };
};

export async function getForContentTypeManagement(cma) {
  const store = getBuiltinsOnly();

  try {
    const res = await cma.getExtensions();
    store[NAMESPACE_EXTENSION] = res.items.map(buildExtensionWidget);
  } catch (e) {
    store[NAMESPACE_EXTENSION] = [];
  }

  return store;
}

export function buildExtensionWidget(data) {
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
