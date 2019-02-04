import { get } from 'lodash';
import { create as createBuiltinWidgetList } from './BuiltinWidgets.es6';
import { toInternalFieldType } from './FieldTypes.es6';

export function create(cma) {
  let cache = {};

  return {
    refresh,
    getAll: () => cache
  };

  async function refresh() {
    cache = { builtin: createBuiltinWidgetList() };

    try {
      const res = await cma.getExtensions();
      cache.extension = res.items.map(buildExtensionWidget);
    } catch (e) {
      cache.extension = [];
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
    },
    custom: true
  };
}
