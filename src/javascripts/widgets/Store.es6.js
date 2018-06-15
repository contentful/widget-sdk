import { get } from 'lodash';
import require from 'require';
import { create as createBuiltinWidgetsList } from 'widgets/builtin';
import fieldFactory from 'fieldFactory';

export function create (cma) {
  let cache = [];

  return {
    refresh,
    getAll: () => cache
  };

  async function refresh () {
    let extensions;
    try {
      const res = await cma.getExtensions();
      extensions = res.items.map(buildExtensionWidget);
    } catch (e) {
      extensions = [];
    }
    cache = await prepareList(extensions);
    return cache;
  }
}

async function prepareList (extensions) {
  // Extension and built-in widget IDs may clash :(
  // Extensions used to "override" built-in widgets.
  // It's far from ideal but we retain this behavior for now.
  // TODO figure out what to do?
  const extensionIds = extensions.map(e => e.id);
  const builtinWidgetsConfig = await getBuiltinWidgetsListConfig();
  const builtin = createBuiltinWidgetsList(builtinWidgetsConfig);
  const filteredBuiltins = builtin.filter(b => {
    return !extensionIds.includes(b.id);
  });

  return [...filteredBuiltins, ...extensions];
}

function buildExtensionWidget (data) {
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

async function getBuiltinWidgetsListConfig () {
  // TODO: Prevent circular ref!
  const LD = require('utils/LaunchDarkly');
  const STRUCTURED_TEXT_FIELD_DEMO_FEATURE_FLAG =
    'feature-at-05-2018-structured-text-field-demo';
  return {
    replaceJsonEditorWithStructuredTextEditor:
      await LD.getCurrentVariation(STRUCTURED_TEXT_FIELD_DEMO_FEATURE_FLAG)
  };
}
