import { get } from 'lodash';
import { create as createBuiltinWidgetsList } from 'widgets/builtin.es6';
import fieldFactory from 'fieldFactory';

export function create(cma) {
  let cache = [];

  return {
    refresh,
    getAll: () => cache
  };

  async function refresh() {
    let extensions;
    try {
      const res = await cma.getExtensions();
      extensions = res.items.map(buildExtensionWidget);
    } catch (e) {
      extensions = [];
    }
    cache = prepareList(extensions);
    return cache;
  }
}

function prepareList(extensions) {
  // Extension and built-in widget IDs may clash :(
  // Extensions used to "override" built-in widgets.
  // It's far from ideal but we retain this behavior for now.
  // TODO figure out what to do?
  const extensionIds = extensions.map(e => e.id);
  const builtin = createBuiltinWidgetsList();
  const filteredBuiltins = builtin.filter(b => {
    return !extensionIds.includes(b.id);
  });

  return [...filteredBuiltins, ...extensions];
}

function buildExtensionWidget(data) {
  const { src, srcdoc } = data.extension;
  const base = src ? { src } : { srcdoc };
  return {
    ...base,
    id: data.sys.id,
    name: data.extension.name,
    fieldTypes: data.extension.fieldTypes.map(fieldFactory.getTypeName),
    sidebar: data.extension.sidebar,
    template: '<cf-iframe-widget />',
    parameters: get(data.extension, 'parameters.instance', []),
    installationParameters: {
      definitions: get(data.extension, 'parameters.installation', []),
      values: data.parameters || {}
    },
    custom: true
  };
}
