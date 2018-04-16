'use strict';

/**
 * @ngdoc service
 * @name widgets
 */
angular.module('contentful')
.factory('widgets', ['require', function (require) {
  var fieldFactory = require('fieldFactory');
  var deepFreeze = require('utils/Freeze').deepFreeze;

  /**
   * @ngdoc type
   * @name Widget.Option
   * @property {string} param
   * @property {string} name
   * @property {string} type
   * @property {string} description
   * @property {any[]}  values
   * @property {any}    default
   */

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

  return {
    getAvailable: getAvailable,
    buildRenderable: buildRenderable,
    filterOptions: filterOptions,
    applyDefaults: applyDefaults,
    filterParams: filterParams
  };

  /**
   * @ngdoc method
   * @name widgets#descriptorsForField
   * @description
   * Return a list of widgets that can be selected for the given field.
   *
   * @param {API.ContentType.Field} field
   * @param {Widget.Descriptor[]} widgets
   * @return {Widget.Descriptor[]}
   */
  function getAvailable (field, widgets) {
    var fieldType = fieldFactory.getTypeName(field);

    return widgets.filter(function (widget) {
      return widget.fieldTypes.includes(fieldType);
    });
  }

  /**
   * @ngdoc method
   * @name widgets#filterParams
   * @description
   * Returns a copy of the `params` object that includes only keys that
   * are applicable to the widget (as defined in `descriptor`).
   *
   * @param {Widget} descriptor
   * @param {object} params
   * @returns {object}
   */
  function filterParams (descriptor, params) {
    return (descriptor.options || []).reduce(function (filtered, option) {
      var param = params[option.param];
      if (typeof param !== 'undefined') {
        filtered[option.param] = param;
      }
      return filtered;
    }, {});
  }


  /**
   * @ngdoc method
   * @name widgets#filterOptions
   * @description
   * Exclude options that are not applicable.
   * @param {Widget} descriptor
   * @param {object} params
   */
  function filterOptions (descriptor, params) {
    var options = descriptor.options || [];
    // Filter out AM/PM selector if date picker mode does not include time
    if (descriptor.id === 'datePicker') {
      return options.filter(function (option) {
        return option.param !== 'ampm' || ['time', 'timeZ'].includes(params.format);
      });
    } else {
      return [].concat(options);
    }
  }

  /**
   * @ngdoc method
   * @name widgets#applyDefaults
   * @description
   * Creates a copy of params provided and sets each widget paramter
   * to its default value if it is not set yet.
   *
   * @param {Widget} descriptor
   * @param {object} params
   * @return {object}
   */
  function applyDefaults (descriptor, params) {
    var cloned = _.isPlainObject(params) ? _.cloneDeep(params) : {};

    return (descriptor.options || []).reduce(function (params, option) {
      if ('default' in option && !(option.param in params)) {
        params[option.param] = option.default;
      }
      return params;
    }, cloned);
  }

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
  function buildRenderable (controls, widgets) {
    return controls.reduce(function (acc, control) {
      if (control.field) {
        var renderable = buildOneRenderable(control, widgets);
        acc[renderable.sidebar ? 'sidebar' : 'form'].push(renderable);
      }
      return acc;
    }, {sidebar: [], form: []});
  }

  function buildOneRenderable (control, widgets) {
    var id = control.widgetId;
    var field = _.cloneDeep(control.field);
    var renderable = {
      // TODO we should use `field.id` but I don’t know if we normalize
      // it so that it is always defined.
      fieldId: control.fieldId,
      widgetId: control.widgetId,
      field: field
    };

    var descriptor = _.find(widgets, {id: id});
    if (!descriptor) {
      renderable.template = getWarningTemplate(id, 'missing');
      return renderable;
    }
    if (!isCompatibleWithField(descriptor, field)) {
      renderable.template = getWarningTemplate(id, 'incompatible');
      return renderable;
    }

    _.extend(renderable, {
      settings: applyDefaults(descriptor, control.settings),
      template: descriptor.template,
      rendersHelpText: descriptor.rendersHelpText,
      defaultHelpText: descriptor.defaultHelpText,
      isFocusable: !descriptor.notFocusable,
      sidebar: !!descriptor.sidebar
    });

    return deepFreeze(renderable);
  }

  function getWarningTemplate (widgetId, message) {
    var accessChecker = require('access_control/AccessChecker');
    return JST.editor_control_warning({
      label: widgetId,
      message: message,
      canUpdateContentTypes: !accessChecker.shouldHide('updateContentType')
    });
  }

  function isCompatibleWithField (widgetDescriptor, field) {
    var fieldType = fieldFactory.getTypeName(field);
    return _.includes(widgetDescriptor.fieldTypes, fieldType);
  }
}]);
