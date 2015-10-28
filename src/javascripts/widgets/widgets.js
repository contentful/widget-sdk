'use strict';

/**
 * @ngdoc service
 * @name widgets
 */
angular.module('contentful')
.factory('widgets', ['$injector', function($injector) {
  var $q = $injector.get('$q');
  var checks       = $injector.get('widgets/checks');
  var deprecations = $injector.get('widgets/deprecations');
  var store        = $injector.get('widgets/store');
  var schemaErrors = $injector.get('validation').errors;

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
   * @property {Locale[]} locales
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
      widgetType: {
        type: 'Symobl',
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

  return {
    get:                 getWidget,
    // TODO remove this method. It is only used for testing
    forField:            typesForField,
    getAvailable:        getAvailable,
    buildRenderable:     buildRenderable,
    defaultWidgetId:     defaultWidgetId,
    optionsForWidget:    optionsForWidget,
    filterOptions:       filterOptions,
    widgetTemplate:      widgetTemplate,
    paramDefaults:       paramDefaults,
    applyDefaults:       applyDefaults,
    validate:            validate,
    filteredParams:      filteredParams,
    setSpace:            setSpace
  };


  function setSpace (space) {
    store.setSpace(space);
    return store.getMap().then(function (widgets) {
      WIDGETS = widgets;
    });
  }

  function getWidget(id) {
    return WIDGETS[id];
  }

  /**
   * @ngdoc method
   * @name widgets#descriptorsForField
   * @description
   * Return a list of widgets that can be selected for the given field
   *
   * @param {API.ContentType.Field} field
   *
   * @param {string} currentWidgetId
   * If the current widget is deprecated, do not remove it from the
   * list of available widgets.
   *
   * @param {boolean} preview
   * Include previe widgets.
   *
   * @return {Promise<Array<Widget.Descriptor>>}
   */
  function getAvailable (field, currentWidgetId, preview) {
    return typesForField(field)
    .then(function (widgets) {
      widgets = _.map(widgets, _.clone);
      _.forEach(widgets, function (widget) {
        widget.options = optionsForWidget(widget.id, 'field');
      });
      return widgets;
    })
    .then(deprecations.createFilter(currentWidgetId, field, preview))
    .then(checks.markMisconfigured);
  }


  /**
   * @ngdoc method
   * @name widgets#forField
   * @param {API.ContentType.Field} field
   * @return {Promise<Array<Widget.Descriptor>>}
   */
  function typesForField(field) {
    var fieldType = detectFieldType(field);
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
   * It also returns a default widget for the File type which actually
   * doesn't exist in the backend and is only used in the asset editor
  */
  function defaultWidgetId(field, contentType) {
    var fieldType = detectFieldType(field);
    var hasValidations = getFieldValidationsOfType(field, 'in').length > 0;
    if(hasValidations && _.contains(WIDGETS['dropdown'].fieldTypes, fieldType)) return 'dropdown';
    if (fieldType === 'Text') {
      if (contentType.data.displayField === field.id ||
          contentType.getId() === 'asset') {
        return 'singleLine';
      } else {
        return 'markdown';
      }
    }
    if (fieldType === 'Entry') return 'entryLinkEditor';
    if (fieldType === 'Asset') return 'assetLinkEditor';
    if (fieldType === 'Entries') return 'entryLinksEditor';
    if (fieldType === 'Assets' ) return 'assetLinksEditor';
    // File is a special field type, only used in the Asset Editor and not on the backend.
    if (fieldType === 'File') return 'fileEditor';
    if (fieldType === 'Boolean') return 'boolean';

    return _.findKey(WIDGETS, function (widget) {
      return _.contains(widget.fieldTypes, fieldType);
    });
  }

  function detectFieldType(field) {
    var type = field.type;
    var linkType = field.linkType;
    if(type === 'Link') return field.linkType;
    if(type === 'Array'){
      var itemsType = dotty.get(field, 'items.type');
      if (itemsType === 'Link') {
        linkType  = dotty.get(field, 'items.linkType');
        if (linkType === 'Entry') return 'Entries';
        if (linkType === 'Asset') return 'Assets';
      }
      if (itemsType === 'Symbol') return 'Symbols';
    }
    return type;
  }

  function getFieldValidationsOfType(field, type) {
    return _.filter(_.pluck(field.validations, type));
  }

  // TODO Remove this method
  function optionsForWidget(widgetId) {
    var widget = WIDGETS[widgetId];
    if (widget) {
      return widget.options || [];
    } else {
      return [];
    }
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
    var options = optionsForWidget(widgetId, 'field');
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
   * @param {string} widgetType
   * @returns {object}
   */
  function paramDefaults(widgetId, widgetType) {
    return _.transform(optionsForWidget(widgetId, widgetType), function (defaults, option) {
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
   * @name widgets#buildRenderable
   * @description
   * Create an object that contains all the necessary data to render a
   * widget
   *
   * @param {API.Widget} widget
   * @return {Widget.Renderable}
   */
  function buildRenderable (widget, locales, defaultLocale) {
    widget = Object.create(widget);

    var template = widgetTemplate(widget.widgetId);
    widget.template = template;

    if (widget.widgetType === 'field')
      applyFieldWidgetProperties(widget, locales);
    else
      applyStaticWidgetProperties(widget, defaultLocale);

    return widget;
  }

  function applyFieldWidgetProperties (widget, locales) {
    widget.locales = locales;
    var descriptor = getWidget(widget.widgetId);
    if (descriptor) {
      _.extend(widget, {
        rendersHelpText: descriptor.rendersHelpText,
        defaultHelpText: descriptor.defaultHelpText,
        isFocusable: !descriptor.notFocusable
      });
    }
  }

  function applyStaticWidgetProperties (widget, defaultLocale) {
    widget.locales = [defaultLocale];
  }

}]);
