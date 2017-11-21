'use strict';

/**
 * @ngdoc service
 * @name widgets
 */
angular.module('contentful')
.factory('widgets', ['require', function (require) {
  var $q = require('$q');
  var fieldFactory = require('fieldFactory');
  var checks = require('widgets/checks');
  var deprecations = require('widgets/deprecations');
  var WidgetStore = require('widgets/store');
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

  /**
   * @ngdoc type
   * @name API.Widget
   * @property {string} widgetId
   * @property {[string]: any} settings
   */
  var WIDGETS = {};

  var store;

  var widgetsService = {
    get: getWidget,
    getCustom: getCustomWidgets,
    getAvailable: getAvailable,
    buildRenderable: buildRenderable,
    filterOptions: filterOptions,
    applyDefaults: applyDefaults,
    filteredParams: filteredParams,
    setSpace: setSpace,
    refresh: refreshWidgetCache
  };
  return widgetsService;

  function refreshWidgetCache () {
    return store.getMap().then(function (widgets) {
      WIDGETS = widgets;
      return widgetsService;
    });
  }

  /**
   * @ngdoc method
   * @name widgets#setSpace
   *
   * @description
   * Gets all widgets for a space and saves the object into the `WIDGETS`
   * variable. Always gets the latest custom widgets from the widgets endpoint.
   *
   * Only `spaceContext.resetWithSpace()` is responsible for calling
   * this method.
   *
   * @param {Data.Endpoint} spaceEndpoint
   * @returns {Promise<Void>}
   */
  function setSpace (spaceEndpoint) {
    store = WidgetStore.create(spaceEndpoint);
    return refreshWidgetCache();
  }

  function getWidget (id) {
    return WIDGETS[id];
  }

  function getCustomWidgets () {
    return _.values(_.pickBy(WIDGETS, function (widget) {
      return widget.custom === true;
    }));
  }

  /**
   * @ngdoc method
   * @name widgets#descriptorsForField
   * @description
   * Return a list of widgets that can be selected for the given field. This
   * method always gets the latest custom widgets from the widgets endpoint.
   *
   * @param {API.ContentType.Field} field
   *
   * @param {string} currentWidgetId
   * If the current widget is deprecated, do not remove it from the
   * list of available widgets.
   *
   * @param {boolean} preview
   * Include preview widgets.
   *
   * @return {Promise<Array<Widget.Descriptor>>}
   */
  function getAvailable (field, currentWidgetId, preview) {
    return refreshWidgetCache()
    .then(typesForField.bind(null, field))
    .then(function (widgets) {
      return _.map(widgets, function (widget) {
        return _.extend({}, widget, {
          options: optionsForWidget(widget.id)
        });
      });
    })
    .then(deprecations.createFilter(currentWidgetId, field, preview))
    .then(checks.markMisconfigured);
  }

  function typesForField (field) {
    var fieldType = fieldFactory.getTypeName(field);
    var widgets = _.filter(WIDGETS, function (widget) {
      return _.includes(widget.fieldTypes, fieldType);
    });
    if (_.isEmpty(widgets)) {
      return $q.reject(new Error('Field type ' + fieldType + ' is not supported by any widget.'));
    } else {
      return $q.resolve(widgets);
    }
  }

  function optionsForWidget (widgetId) {
    return _.get(WIDGETS, [widgetId, 'options'], []);
  }


  /**
   * @ngdoc method
   * @name widgets#filteredParams
   * @description
   * Returns a copy of the `params` object that includes only keys that
   * are applicable to the widget.
   *
   * @param {string} widgetId
   * @param {object} params
   * @returns {object}
   */
  function filteredParams (widgetId, params) {
    var options = optionsForWidget(widgetId);
    return _.transform(options, function (filtered, option) {
      var param = params[option.param];
      if (!_.isUndefined(param)) {
        filtered[option.param] = param;
      }
    }, {});
  }


  /**
   * @ngdoc method
   * @name widgets#filterOptions
   * @param {Widget.Option[]} options
   * @param {object} params
   */
  function filterOptions (widgetOptions, settings) {
    settings = _.isObject(settings) ? settings : {};
    return _.filter(widgetOptions || [], shouldOptionBeVisible);

    function shouldOptionBeVisible (option) {
      var dependencies = option.dependsOnEvery || option.dependsOnAny;
      var everyOrSome = option.dependsOnEvery ? 'every' : 'some';

      if (!_.isObject(dependencies) || !_.keys(dependencies).length) {
        return true;
      }

      return _[everyOrSome](dependencies, areMet);
    }

    function areMet (acceptedValues, paramName) {
      acceptedValues = _.isArray(acceptedValues) ? acceptedValues : [acceptedValues];
      return _.includes(acceptedValues, settings[paramName]);
    }
  }

  /**
   * @ngdoc method
   * @name widgets#applyDefaults
   * @description
   * Sets each widget paramter to its default value if it is not set yet.
   *
   * @param {string} widgetId
   * @param {object} params
   */
  function applyDefaults (widgetId, params) {
    var options = optionsForWidget(widgetId);
    return _.forEach(options, function (option) {
      if ('default' in option && !(option.param in params)) {
        params[option.param] = option.default;
      }
    });
  }

  /**
   * @ngdoc method
   * @name widgets#buildRenderable
   * @description
   * Create an object that contains all the necessary data to render a
   * field control.
   *
   * @param {Data.FieldControl[]} controls
   * @return {object}
   */
  function buildRenderable (controls) {
    var renderable = {sidebar: [], form: []};
    _.forEach(controls, function (control) {
      if (!control.field) {
        return;
      }
      control = buildOneRenderable(control);
      if (control.sidebar) {
        renderable.sidebar.push(control);
      } else {
        renderable.form.push(control);
      }
    });
    return renderable;
  }

  /**
   * @ngdoc method
   * @name widgets#buildRenderable
   * @description
   * Create an object that contains all the necessary data to render a
   * field control.
   *
   * @param {Data.FieldControl} control
   * @return {Widget.Renderable}
   */
  function buildOneRenderable (widget) {
    var id = widget.widgetId;
    var settings = _.cloneDeep(widget.settings);
    var field = _.cloneDeep(widget.field);

    if (!_.isObject(settings)) {
      settings = {};
    }
    applyDefaults(id, settings);

    var renderable = {
      // TODO we should use `field.id` but I don’t know if we normalize
      // it so that it is always defined.
      fieldId: widget.fieldId,
      widgetId: widget.widgetId,
      field: field,
      settings: settings
    };


    var descriptor = getWidget(id);
    if (!descriptor) {
      renderable.template = getWarningTemplate(id, 'missing');
      return renderable;
    }

    _.extend(renderable, {
      template: descriptor.template,
      rendersHelpText: descriptor.rendersHelpText,
      defaultHelpText: descriptor.defaultHelpText,
      isFocusable: !descriptor.notFocusable,
      sidebar: !!descriptor.sidebar
    });

    if (!isCompatibleWithField(descriptor, field)) {
      renderable.template = getWarningTemplate(id, 'incompatible');
    }

    return deepFreeze(renderable);
  }

  function getWarningTemplate (widgetId, message) {
    var accessChecker = require('accessChecker');
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
