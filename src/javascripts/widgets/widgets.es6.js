import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import { deepFreeze } from 'utils/Freeze.es6';
import { applyDefaultValues } from 'widgets/WidgetParametersUtils.es6';

/**
 * @ngdoc service
 * @name widgets
 */
registerFactory('widgets', [
  '$injector',
  'fieldFactory',
  ($injector, fieldFactory) => {
    /**
     * @ngdoc type
     * @name Widget.Renderable
     * @description
     * This type is exposed to the cfEntityField directive to render a
     * field control.
     *
     * It is created by the `buildRenderable()` function from a list of
     * `Data.FieldControl`.
     *
     * @property {string} fieldId
     * @property {string} widgetId
     * @property {object} settings
     * @property {API.Field} field
     *
     * @property {string} template
     * @property {string} defaultHelpText
     * @property {boolean} rendersHelpText
     * @property {boolean} isFocusable
     * @property {boolean} sidebar
     */

    /**
     * @ngdoc type
     * @name Data.FieldControl
     * @description
     * The Field Control object is used to create editor controls.
     *
     * All field controls for a Content Type are retrieved by the
     * `data/editingInterfaces`. The API representation is then converted
     * to this type.
     * @property {string} fieldId
     * @property {string} widgetId
     * @property {object} settings
     * @property {API.Field} field
     */

    return { buildRenderable: buildRenderable };

    /**
     * @ngdoc method
     * @name widgets#buildRenderable
     * @description
     * Create an object that contains all the necessary data to render a
     * field control.
     *
     * @param {Data.FieldControl[]} controls
     * @param {Widget[]} widgets
     * @return {object}
     */
    function buildRenderable(controls, widgets) {
      return controls.reduce(
        (acc, control) => {
          if (control.field) {
            const renderable = buildOneRenderable(control, widgets);
            acc[renderable.sidebar ? 'sidebar' : 'form'].push(renderable);
          }
          return acc;
        },
        { sidebar: [], form: [] }
      );
    }

    function buildOneRenderable(control, widgets) {
      const id = control.widgetId;
      const field = _.cloneDeep(control.field);
      const renderable = {
        // TODO we should use `field.id` but I don’t know if we normalize
        // it so that it is always defined.
        fieldId: control.fieldId,
        widgetId: control.widgetId,
        field: field,
        settings: {}
      };

      const descriptor = _.find(widgets, { id: id });
      if (!descriptor) {
        renderable.template = getWarningTemplate(id, 'missing');
        return renderable;
      }
      if (!isCompatibleWithField(descriptor, field)) {
        renderable.template = getWarningTemplate(id, 'incompatible');
        return renderable;
      }

      _.extend(renderable, {
        settings: applyDefaultValues(descriptor.parameters, control.settings),
        installationParameterValues: applyDefaultValues(
          _.get(descriptor, ['installationParameters', 'definitions']) || [],
          _.get(descriptor, ['installationParameters', 'values']) || {}
        ),
        template: descriptor.template,
        rendersHelpText: descriptor.rendersHelpText,
        defaultHelpText: descriptor.defaultHelpText,
        isFocusable: !descriptor.notFocusable,
        sidebar: !!descriptor.sidebar
      });

      if (descriptor.custom) {
        renderable.custom = true;
        renderable.trackingData = {
          extension_id: descriptor.id,
          extension_name: descriptor.name,
          field_id: control.fieldId,
          field_type: _.get(field, ['type']),
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

    function getWarningTemplate(widgetId, message) {
      const accessChecker = $injector.get('access_control/AccessChecker/index.es6');

      return JST.editor_control_warning({
        label: widgetId,
        message: message,
        canUpdateContentTypes: !accessChecker.shouldHide('update', 'contentType')
      });
    }

    function isCompatibleWithField(widgetDescriptor, field) {
      const fieldType = fieldFactory.getTypeName(field);
      return _.includes(widgetDescriptor.fieldTypes, fieldType);
    }
  }
]);
