'use strict';

/**
 * @ngdoc service
 * @name widgets
 */
angular.module('contentful')
.factory('widgets', ['$injector', function($injector) {
  var $q           = $injector.get('$q');
  var fieldFactory = $injector.get('fieldFactory');
  var checks       = $injector.get('widgets/checks');
  var deprecations = $injector.get('widgets/deprecations');
  var WidgetStore  = $injector.get('widgets/store');

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
   * @property {string} template
   * @property {object} widgetParams
   * @property {string} defaultHelpText
   * @property {boolean} rendersHelpText
   * @property {boolean} isFocusable
   */


  /**
   * @ngdoc type
   * @name API.Widget
   * @property {string} widgetId
   * @property {[string]: any} widgetParams
   */
  var WIDGETS = {};

  var store;

  var widgetsService = {
    get:                 getWidget,
    getAvailable:        getAvailable,
    buildRenderable:     buildRenderable,
    filterOptions:       filterOptions,
    applyDefaults:       applyDefaults,
    filteredParams:      filteredParams,
    setSpace:            setSpace
  };
  return widgetsService;

  function refreshWidgetCache() {
    return store.getMap().then(function(widgets) {
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
   * @param {Client.Space} space
   * @returns {Promise<Void>}
   */
  function setSpace (space) {
    store = new WidgetStore(space);
    return refreshWidgetCache();
  }

  function getWidget(id) {
    return WIDGETS[id];
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

  function typesForField(field) {
    var fieldType = fieldFactory.getTypeName(field);
    var widgets = _.filter(WIDGETS, function (widget) {
      return _.contains(widget.fieldTypes, fieldType);
    });
    if (_.isEmpty(widgets)) {
      return $q.reject(new Error('Field type '+fieldType+' is not supported by any widget.'));
    } else {
      return $q.when(widgets);
    }
  }

  function optionsForWidget(widgetId) {
    return dotty.get(WIDGETS, [widgetId, 'options'], []);
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
  function filterOptions(widgetOptions, widgetParams) {
    widgetParams = _.isObject(widgetParams) ? widgetParams : {};
    return _.filter(widgetOptions || [], shouldOptionBeVisible);

    function shouldOptionBeVisible(option) {
      var dependencies = option.dependsOnEvery || option.dependsOnAny;
      var everyOrAny = option.dependsOnEvery ? 'every' : 'any';

      if (!_.isObject(dependencies) || !_.keys(dependencies).length) {
        return true;
      }

      return _[everyOrAny](dependencies, areMet);
    }

    function areMet(acceptedValues, paramName) {
      acceptedValues = _.isArray(acceptedValues) ? acceptedValues : [acceptedValues];
      return _.contains(acceptedValues, widgetParams[paramName]);
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
   * widget.
   *
   * @param {Data.Widget[]} widget
   * @return {object}
   */
  function buildRenderable (widgets) {
    var renderable = {sidebar: [], form: []};
    _.forEach(widgets, function (widget) {
      if (!widget.field) {
        return;
      }
      widget = buildOneRenderable(widget);
      if (widget.sidebar) {
        renderable.sidebar.push(widget);
      } else {
        renderable.form.push(widget);
      }
    });
    return renderable;
  }

  function buildOneRenderable (widget) {
    var id = widget.widgetId;
    widget = _.cloneDeep(widget);

    var template = widgetTemplate(id);
    widget.template = template;

    widget.widgetParams = widget.widgetParams || {};
    applyDefaults(id, widget.widgetParams);

    var descriptor = getWidget(id);
    if (descriptor) {
      _.extend(widget, {
        rendersHelpText: descriptor.rendersHelpText,
        defaultHelpText: descriptor.defaultHelpText,
        isFocusable: !descriptor.notFocusable,
        sidebar: !!descriptor.sidebar
      });
    }
    return widget;
  }

  function widgetTemplate(widgetId) {
    var widget = WIDGETS[widgetId];
    if (widget) {
      return widget.template;
    } else {
      return '<div class="missing-widget-template">Unknown editor widget "'+widgetId+'"</div>';
    }
  }
}]);
