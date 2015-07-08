'use strict';

/**
 * @ngdoc service
 * @name widgets
 */
angular.module('contentful')
.factory('widgets', ['$injector', function($injector){
  var $q = $injector.get('$q');
  var widgetChecks = $injector.get('widgetChecks');
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
  var COMMON_OPTIONS = [
    {
      param: 'helpText',
      name: 'Help text',
      type: 'Text',
      description: 'This help text will show up below the field'
    },
  ];

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
    forField:            typesForField,
    descriptorsForField: descriptorsForField,
    defaultWidgetId:     defaultWidgetId,
    optionsForWidget:    optionsForWidget,
    filterOptions:       filterOptions,
    widgetTemplate:      widgetTemplate,
    paramDefaults:       paramDefaults,
    registerWidget:      registerWidget,
    applyDefaults:       applyDefaults,
    validate:            validate,
    filteredParams:      filteredParams
  };


  function getWidget(id) {
    return WIDGETS[id];
  }


  /**
   * @ngdoc method
   * @name widgets#descriptorsForField
   * @param {API.ContentType.Field} field
   * @return {Promise<Array<Widget>>}
   */
  function descriptorsForField (field) {
    return typesForField(field)
    .then(function (widgets) {
      widgets = _.map(widgets, _.clone);
      _.forEach(widgets, function (widget) {
        widget.options = optionsForWidget(widget.id, 'field');
      });
      return widgets;
    })
    .then(widgetChecks.markDeprecated)
    .then(widgetChecks.markMisconfigured);
  }

  /**
   * @ngdoc method
   * @name widgets#forField
   * @param {API.ContentType.Field} field
   * @return {Promise<Array<Widget>>}
   */
  function typesForField(field) {
    var fieldType = detectFieldType(field);
    var widgets =  _(WIDGETS)
    .pick(function (widget) {
      return _.contains(widget.fieldTypes, fieldType);
    })
    .map(function (widget, widgetId) {
      return _.extend({id: widgetId}, widget);
    })
    .valueOf();
    if (_.isEmpty(widgets)) {
      return $q.reject(new Error('Field type '+fieldType+' is not supported by any widget.'));
    } else {
      return $q.when(widgets);
    }
  }

  /**
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
    if (fieldType === 'File' ) return 'fileEditor';

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

  function optionsForWidget(widgetId, widgetType) {
    var widget = WIDGETS[widgetId];
    if (widget && widgetType == 'field') {
      return COMMON_OPTIONS.concat(widget.options || []);
    } else if(widgetType == 'static'){
      return widget.options;
    }
    return [];
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
   * @param {} options
   * @param {} params
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

  function registerWidget(id, descriptor) {
    WIDGETS[id] = WIDGETS[id] || descriptor;
  }

  /**
   * @ngdoc method
   * @name widgets#applyDefaults
   * @description
   * Sets each widget paramter to its default value if it is not set yet.
   *
   * @param {object} params
   * @param {options} Widget.Option[]
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
   * @return {Error[]}
   */
  function validate (widget) {
    return schemaErrors(widget, widgetSchema);
  }

}]);
