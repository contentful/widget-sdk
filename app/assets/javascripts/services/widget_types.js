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

  var WIDGET_TYPES = {};

  function typesForField(field) {
    var fieldType = detectFieldType(field);
    var widgetTypes =  _(WIDGET_TYPES)
    .pick(function (widgetType) {
      return _.contains(widgetType.fieldTypes, fieldType);
    })
    .map(function (widgetType, widgetTypeId) {
      return _.extend({id: widgetTypeId}, widgetType);
    })
    .valueOf();
    if (_.isEmpty(widgetTypes)) {
      return $q.reject(new Error('Field type '+fieldType+' is not supported by any widget.'));
    } else {
      return $q.when(widgetTypes);
    }
  }

  function defaultWidgetType(field, contentType) {
    var fieldType = detectFieldType(field);
    var hasValidations = getFieldValidationsOfType(field, 'in').length > 0;
    if(hasValidations && _.contains(WIDGET_TYPES['dropdown'].fieldTypes, fieldType)) return 'dropdown';
    if (fieldType === 'Text') {
      if (contentType.data.displayField === field.id ||
          contentType.getId() === 'asset') {
        return 'singleLine';
      } else {
        return 'markdown';
      }
    }
    if (fieldType === 'Asset'  || fieldType === 'Entry'   ) return 'linkEditor';
    if (fieldType === 'Assets' || fieldType === 'Entries' ) return 'linksEditor';
    if (fieldType === 'File' ) return 'fileEditor';

    return _.findKey(WIDGET_TYPES, function (widget) {
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

  function optionsForWidgetType(widgetType) {
    var widget = WIDGET_TYPES[widgetType];
    if (widget) {
      return COMMON_OPTIONS.concat(widget.options || []);
    } else {
      return [];
    }
  }

  function paramDefaults(widgetType) {
    return _.transform(optionsForWidgetType(widgetType), function (defaults, option) {
      defaults[option.param] = option.default;
    }, {});
  }

  function widgetTemplate(widgetType) {
    var widget = WIDGET_TYPES[widgetType];
    if (widget) {
      return widget.template;
    } else {
      return '<div class="missing-widget-template">Unkown editor widget "'+widgetType+'"</div>';
    }
  }

  function registerWidget(id, options) {
    var descriptor = _.pick(options, ['fieldTypes', 'name', 'options', 'template']);
    WIDGET_TYPES[id] = WIDGET_TYPES[id] || descriptor;
  }

  return {
    forField:              typesForField,
    defaultType:           defaultWidgetType,
    optionsForWidgetType:  optionsForWidgetType,
    widgetTemplate:        widgetTemplate,
    paramDefaults:         paramDefaults,
    registerWidget:        registerWidget
  };

}]);
