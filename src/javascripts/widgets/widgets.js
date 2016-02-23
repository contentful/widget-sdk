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
  var schemaErrors = $injector.get('validation').errors;
  var eiHelpers    = $injector.get('editingInterfaces/helpers');

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

  // TODO move this to validation library
  var widgetSchema = {
    type: 'Object',
    properties: {
      id: {
        type: 'Symbol',
        required: true
      },
      fieldId: {
        type: 'Symbol',
        required: true,
      },
      widgetId: {
        type: 'Symbol',
        required: true
      },
      widgetParams: {
        type: 'Object',
        properties: {
          helpText: {
            type: 'Text',
            validations: [{size: {max: 300}}]
          }
        },
        additionalProperties: true
      }
    },
    additionalProperties: true
  };

  // Maps type names to builtin widget IDs. Type names are those
  // returned by `fieldFactory.getTypeName`.
  var DEFAULT_WIDGETS = {
    'Text':     'markdown',
    'Symbol':   'singleLine',
    'Symbols':  'listInput',
    'Integer':  'numberEditor',
    'Number':   'numberEditor',
    'Boolean':  'boolean',
    'Date':     'datePicker',
    'Location': 'locationEditor',
    'Object':   'objectEditor',
    'Entry':    'entryLinkEditor',
    'Entries':  'entryLinksEditor',
    'Asset':    'assetLinkEditor',
    'Assets':   'assetLinksEditor',
  };

  var widgetsService = {
    get:                 getWidget,
    getAvailable:        getAvailable,
    buildRenderable:     buildRenderable,
    defaultWidgetId:     defaultWidgetId,
    filterOptions:       filterOptions,
    paramDefaults:       paramDefaults,
    applyDefaults:       applyDefaults,
    validate:            validate,
    filteredParams:      filteredParams,
    setSpace:            setSpace,
    buildSidebarWidgets: buildSidebarWidgets
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

  /**
   * @ngdoc method
   * @name widgets#defaultWidgetId
   * @param {API.ContentType.Field} field
   * @param {Client.ContentType} contentType
   * @return {string}
   *
   * @description
   * This method determines the default widget for a given field.
   *
   * It accounts for legacy behavior for when there were no user selectable
   * widgets for a given field and some fields would have different widgets
   * in different occasions, specifically:
   * - Text field: defaults to markdown, unless it is a title field.
   *   where it gets switched to singleLine
   * - Any field that allows for predefined values: gets changed to a dropdown
   *   in the presence of the 'in' validation
  */
  function defaultWidgetId(field, contentType) {
    var fieldType = fieldFactory.getTypeName(field);

    // FIXME We create the editing interface, and thus the widget ids
    // before any validation can be set. So I think this is not need.
    var shouldUseDropdown = hasInValidation(field.validations);
    var canUseDropdown = _.contains(dotty.get(WIDGETS, ['dropdown', 'fieldTypes']), fieldType);
    if (shouldUseDropdown && canUseDropdown) {
      return 'dropdown';
    }

    if (fieldType === 'Text') {
      var isDisplayField = contentType.data.displayField === field.id;
      if (isDisplayField) {
        return 'singleLine';
      } else {
        return 'markdown';
      }
    }

    return DEFAULT_WIDGETS[fieldType];
  }

  function hasInValidation(validations) {
    return _.find(validations, function (validation) {
      return 'in' in validation;
    });
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
      if (!_.isUndefined(param))
        filtered[option.param] = param;
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
   * @name widgets#paramDefaults
   * @param {string} widgetId
   * @returns {object}
   */
  function paramDefaults(widgetId) {
    return _.transform(optionsForWidget(widgetId), function (defaults, option) {
      defaults[option.param] = option.default;
    }, {});
  }

  function widgetTemplate(widgetId) {
    var widget = WIDGETS[widgetId];
    if (widget) {
      return widget.template;
    } else {
      return '<div class="missing-widget-template">Unknown editor widget "'+widgetId+'"</div>';
    }
  }

  /**
   * @ngdoc method
   * @name widgets#applyDefaults
   * @description
   * Sets each widget paramter to its default value if it is not set yet.
   *
   * @param {object} params
   * @param {Widget.Option[]} options
   */
  function applyDefaults (params, options) {
    return _.forEach(options, function (option) {
      if ('default' in option && !(option.param in params)) {
        params[option.param] = option.default;
      }
    });
  }

  /**
   * @ngdoc method
   * @name widgets#validate
   * @description
   * Validate the widget against the schema and return a list of
   * errors.
   * @param {Widget} widget
   * @return {Error[]}
   */
  function validate (widget) {
    return schemaErrors(widget, widgetSchema);
  }

  /**
   * @ngdoc method
   * @name widgets#buildSidebarWidgets
   * @description
   * From a list of widget definition from the editing interface build
   * a list of renderable widgets that can be passed to the
   * `cfWidgetRenderer` directive.
   *
   * The list includes only widgets that have the `sidebar` property
   * set to a truthy value.
   *
   * The function is used to setup the entry editor state.
   *
   * TODO Remove duplication with FormWidgetsController.
   *
   * @param {API.Widget[]} widgets
   * @param {API.Fields[]} fields
   * @return {Widget.Renderable[]}
   */
  function buildSidebarWidgets (apiWidgets, fields) {
    return  _(apiWidgets)
      .map(function (widget) {
        var field = eiHelpers.findField(fields, widget);
        var desc = getWidget(widget.widgetId);
        return _.extend({
          field: field
        }, widget, desc);
      })
      .filter(function (widget) {
        return widget.sidebar && widget.field;
      })
      .value();
  }

  /**
   * @ngdoc method
   * @name widgets#buildRenderable
   * @description
   * Create an object that contains all the necessary data to render a
   * widget.
   *
   * @param {API.Widget} widget
   * @return {Widget.Renderable}
   */
  function buildRenderable (widget) {
    widget = Object.create(widget);

    var template = widgetTemplate(widget.widgetId);
    widget.template = template;

    applyWidgetProperties(widget);
    return widget;
  }

  function applyWidgetProperties (widget) {
    var descriptor = getWidget(widget.widgetId);
    if (descriptor) {
      _.extend(widget, {
        rendersHelpText: descriptor.rendersHelpText,
        defaultHelpText: descriptor.defaultHelpText,
        isFocusable: !descriptor.notFocusable,
        sidebar: !!descriptor.sidebar
      });
    }
  }
}]);
