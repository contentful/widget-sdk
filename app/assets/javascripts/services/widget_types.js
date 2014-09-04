'use strict';
angular.module('contentful').factory('widgetTypes', ['$injector', function($injector){
  var $q = $injector.get('$q');

  var COMMON_OPTIONS = [
    {
      param: 'helpText',
      name: 'Help text',
      type: 'Text',
      description: 'This help text will show up below the field'
    },
    //{
      //param: 'numberTest',
      //name: 'Number Test',
      //type: 'Number',
      //description: 'This is a number test'
    //},
    //{
      //param: 'booleanTest',
      //name: 'Boolean Test',
      //type: 'Boolean',
      //description: 'This is a boolean test'
    //},
    //{
      //param: 'predefinedTest',
      //name: 'Predefined Test',
      //type: 'Predefined',
      //description: 'This is a predefined Test',
      //values: [1,2,3, true, false]
    //},
  ];

  var WIDGETS = {};

  function widgetsForField(field) {
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
      return $q.reject(new Error('Field type '+fieldType+' is not supported.'));
    } else {
      return $q.when(widgets);
    }
  }

  function defaultWidgetType(field, contentType) {
    var type = detectFieldType(field);
    var hasValidations = getFieldValidationsOfType(field, 'in').length > 0;
    if(hasValidations && _.contains(WIDGETS['dropdown'].fieldTypes, type)) return 'dropdown';
    if (type === 'Text') {
      if (contentType.data.displayField === field.id ||
          contentType.getId() === 'asset') {
        return 'singleLine';
      } else {
        return 'markdown';
      }
    }
    if (type === 'Link' ) return 'linkEditor';
    if (type === 'File' ) return 'fileEditor';

    return _.findKey(WIDGETS, function (widget) {
      return _.contains(widget.fieldTypes, type);
    });
  }

  function detectFieldType(field) {
    var type = field.type;
    var itemsType = dotty.get(field, 'items.type');
    if(type === 'Array' && itemsType){
      if (itemsType === 'Link'  ) return 'Links';
      if (itemsType === 'Symbol') return 'Symbols';
    }
    return type;
  }

  function getFieldValidationsOfType(field, type) {
    return _.pluck(field.validations, type);
  }

  function optionsForWidget(widget) {
    if (widget) {
      return COMMON_OPTIONS.concat(widget.options || []);
    } else {
      return [];
    }
  }

  function optionsForWidgetType(type) {
    var widget = WIDGETS[type];
    return optionsForWidget(widget);
  }

  function paramDefaults(widgetType) {
    return _.transform(optionsForWidgetType(widgetType), function (defaults, option) {
      defaults[option.param] = option.default;
    }, {});
  }

  function widgetTemplate(widgetType) {
    var widget = WIDGETS[widgetType];
    if (widget) {
      return widget.template;
    } else {
      return '<div class="missing-widget-template">Unkown editor widget "'+widgetType+'"</div>';
    }
  }

  function registerWidget(id, options) {
    var descriptor = _.pick(options, ['fieldTypes', 'name', 'options', 'template']);
    WIDGETS[id] = WIDGETS[id] || descriptor;
  }

  return {
    forField:              widgetsForField,
    defaultType:           defaultWidgetType,
    optionsForWidgetType:  optionsForWidgetType,
    widgetTemplate:        widgetTemplate,
    paramDefaults:         paramDefaults,
    registerWidget:        registerWidget
  };

}]);
