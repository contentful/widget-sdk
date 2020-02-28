import { get, cloneDeep } from 'lodash';
import { deepFreeze } from 'utils/Freeze';
import { applyDefaultValues } from './WidgetParametersUtils';
import { toInternalFieldType } from './FieldTypes';
import { NAMESPACE_EXTENSION, NAMESPACE_APP } from './WidgetNamespaces';

const CUSTOM_NAMESPACES = [NAMESPACE_EXTENSION, NAMESPACE_APP];

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

  const descriptor = widgets.find(w => {
    return w.namespace === control.widgetNamespace && w.id === control.widgetId;
  });

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
      buildTemplate: descriptor.buildTemplate,
      renderFieldEditor: descriptor.renderFieldEditor,
      renderWhen: descriptor.renderWhen,
      isFocusable: !descriptor.notFocusable,
      isBackground: descriptor.isBackground,
      sidebar: !!descriptor.sidebar
    })
  );
}

function convertToRenderable(item, widgets) {
  const renderable = {
    widgetId: item.widgetId,
    widgetNamespace: item.widgetNamespace
  };

  const descriptor = widgets.find(w => {
    return w.namespace === item.widgetNamespace && w.id === item.widgetId;
  });

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
}

export function buildSidebarRenderables(sidebar, widgets) {
  return sidebar
    .filter(item => CUSTOM_NAMESPACES.includes(item.widgetNamespace))
    .map(item => convertToRenderable(item, widgets));
}

export function buildEditorRenderable(editor, widgets) {
  if (editor && CUSTOM_NAMESPACES.includes(editor.widgetNamespace)) {
    return convertToRenderable(editor, widgets);
  }
}
