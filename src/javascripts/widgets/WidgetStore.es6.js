import { get } from 'lodash';
import { create as createBuiltinWidgetList } from './BuiltinWidgets.es6';
import { toInternalFieldType } from './FieldTypes.es6';
import { NAMESPACE_BUILTIN, NAMESPACE_EXTENSION } from './WidgetNamespaces.es6';

export function create(cma) {
  const cache = { [NAMESPACE_BUILTIN]: createBuiltinWidgetList() };

  return {
    refresh,
    getAll: () => cache
  };

  async function refresh() {
    try {
      const res = await cma.getExtensions();
      cache[NAMESPACE_EXTENSION] = res.items.map(buildExtensionWidget);
    } catch (e) {
      cache[NAMESPACE_EXTENSION] = [];
    }

    return cache;
  }
}

function buildExtensionWidget(data) {
  const { src, srcdoc } = data.extension;
  const base = src ? { src } : { srcdoc };
  return {
    ...base,
    id: data.sys.id,
    name: data.extension.name,
    fieldTypes: data.extension.fieldTypes.map(toInternalFieldType),
    sidebar: data.extension.sidebar,
    parameters: get(data.extension, 'parameters.instance', []),
    installationParameters: {
      definitions: get(data.extension, 'parameters.installation', []),
      values: data.parameters || {}
    }
  };
}
