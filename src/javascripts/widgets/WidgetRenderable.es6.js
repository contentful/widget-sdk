import { get, cloneDeep } from 'lodash';
import { deepFreeze } from 'utils/Freeze.es6';
import { applyDefaultValues } from './WidgetParametersUtils.es6';
import { toInternalFieldType } from './FieldTypes.es6';

/**
 * Given EditorInterface controls and a list of all widgets in a space
 * builds an array of "renderables". A "renderable" is a data structure
 * holding all the information needed to render an editor for a field.
 *
 * @property {string} fieldId
 * @property {string} widgetId
 * @property {object} settings
 * @property {object} installationParameterValues
 * @property {object} field
 * @property {string} template
 * @property {string} defaultHelpText
 * @property {boolean} rendersHelpText
 * @property {boolean} isFocusable
 * @property {boolean} sidebar
 * @property {boolean} custom
 * @property {string} src
 * @property {string} srcdoc
 * @property {object} trackingData
 */
export default function buildRenderables(controls, widgets) {
  return controls.reduce(
    (acc, control) => {
      if (control.field) {
        const renderable = buildOneRenderable(control, widgets);
        const type = renderable.sidebar ? 'sidebar' : 'form';
        acc[type].push(renderable);
      }
      return acc;
    },
    { sidebar: [], form: [] }
  );
}

function buildOneRenderable(control, widgets) {
  const fieldType = toInternalFieldType(control.field);

  const renderable = {
    fieldId: control.fieldId,
    widgetId: control.widgetId,
    field: cloneDeep(control.field),
    settings: {}
  };

  const descriptor = getWidgetDescriptor(widgets, control);

  if (!descriptor) {
    renderable.template = `<react-component name="widgets/WidgetRenderWarning.es6" props="{ message: 'missing' }" />`;
    return renderable;
  }
  if (!descriptor.fieldTypes.includes(fieldType)) {
    renderable.template = `<react-component name="widgets/WidgetRenderWarning.es6" props="{ message: 'incompatible' }" />`;
    return renderable;
  }

  Object.assign(renderable, {
    custom: !!descriptor.custom,
    settings: applyDefaultValues(
      get(descriptor, ['parameters'], []),
      get(control, ['settings'], {})
    ),
    installationParameterValues: applyDefaultValues(
      get(descriptor, ['installationParameters', 'definitions'], []),
      get(descriptor, ['installationParameters', 'values'], {})
    ),
    template: descriptor.template,
    rendersHelpText: descriptor.rendersHelpText,
    defaultHelpText: descriptor.defaultHelpText,
    isFocusable: !descriptor.notFocusable,
    sidebar: !!descriptor.sidebar
  });

  if (renderable.custom) {
    renderable.trackingData = {
      extension_id: descriptor.id,
      extension_name: descriptor.name,
      field_id: control.fieldId,
      field_type: fieldType,
      installation_params: Object.keys(renderable.installationParameterValues),
      instance_params: Object.keys(renderable.settings),
      sidebar: renderable.sidebar
    };

    if (descriptor.src) {
      renderable.src = descriptor.src;
      renderable.trackingData.src = descriptor.src;
    } else {
      renderable.srcdoc = descriptor.srcdoc;
    }
  }

  return deepFreeze(renderable);
}

function getWidgetDescriptor(widgets, { widgetId, widgetNamespace }) {
  const findInNamespace = namespaceWidgets => {
    namespaceWidgets = Array.isArray(namespaceWidgets) ? namespaceWidgets : [];
    return namespaceWidgets.find(w => w.id === widgetId);
  };

  // If a valid widget namespace is given we resolve the widget from
  // the specified namespace and don't fall back. This is a preferred
  // way of widget resolution since it's not possible for builtin and
  // extension names to clash.
  if (typeof widgetNamespace === 'string') {
    return findInNamespace(widgets[widgetNamespace]);
  }

  // Historically if there is an extension with ID the same as a builtin
  // editor ID the extension takes precedence. The code below checks
  // the extension namespace first and then falls back to builtin widgets.
  return findInNamespace(widgets.extension) || findInNamespace(widgets.builtin);
}
