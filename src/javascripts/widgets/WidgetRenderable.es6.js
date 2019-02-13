import { get, cloneDeep } from 'lodash';
import { deepFreeze } from 'utils/Freeze.es6';
import { applyDefaultValues } from './WidgetParametersUtils.es6';
import { toInternalFieldType } from './FieldTypes.es6';
import { NAMESPACE_EXTENSION } from './WidgetNamespaces.es6';

// Given EditorInterface controls and a list of all widgets in a space
// builds an array of "renderables". A "renderable" is a data structure
// holding all the information needed to render an editor for a field.
export function buildRenderables(controls, widgets) {
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
  const renderable = {
    fieldId: control.fieldId,
    widgetId: control.widgetId,
    widgetNamespace: control.widgetNamespace,
    field: cloneDeep(control.field)
  };

  const namespaceWidgets = widgets[control.widgetNamespace] || [];
  const descriptor = namespaceWidgets.find(w => w.id === control.widgetId);

  if (descriptor) {
    Object.assign(renderable, { descriptor });
  } else {
    return Object.assign(renderable, { problem: 'missing' });
  }

  const fieldType = toInternalFieldType(control.field);
  if (!descriptor.fieldTypes.includes(fieldType)) {
    return Object.assign(renderable, { problem: 'incompatible' });
  }

  const parameters = {
    instance:
      applyDefaultValues(get(descriptor, ['parameters'], []), get(control, ['settings'], {})) || {},
    installation:
      applyDefaultValues(
        get(descriptor, ['installationParameters', 'definitions'], []),
        get(descriptor, ['installationParameters', 'values'], {})
      ) || {}
  };

  return deepFreeze(
    Object.assign(renderable, {
      settings: parameters.instance, // Consumed by builtin widgets.
      parameters, // Consumed by extensions.
      template: descriptor.template,
      isFocusable: !descriptor.notFocusable,
      isBackground: descriptor.isBackground,
      sidebar: !!descriptor.sidebar
    })
  );
}

export function buildSidebarRenderables(sidebar, widgets) {
  const items = sidebar.filter(item => item.widgetNamespace === NAMESPACE_EXTENSION);

  return items.map(item => {
    const renderable = {
      widgetId: item.widgetId,
      widgetNamespace: item.widgetNamespace
    };

    const namespaceWidgets = widgets[NAMESPACE_EXTENSION] || [];
    const descriptor = namespaceWidgets.find(w => w.id === item.widgetId);

    if (descriptor) {
      Object.assign(renderable, { descriptor });
    } else {
      return Object.assign(renderable, { problem: 'missing' });
    }

    return deepFreeze(
      Object.assign(renderable, {
        parameters: {
          instance:
            applyDefaultValues(get(descriptor, ['parameters'], []), get(item, ['settings'], {})) ||
            {},
          installation:
            applyDefaultValues(
              get(descriptor, ['installationParameters', 'definitions'], []),
              get(descriptor, ['installationParameters', 'values'], {})
            ) || {}
        }
      })
    );
  });
}
