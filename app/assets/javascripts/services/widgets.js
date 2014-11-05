'use strict';
angular.module('contentful').factory('widgets', ['$injector', function($injector){
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

  function registerWidget(id, options) {
    var descriptor = _.pick(options, ['fieldTypes', 'name', 'options', 'template']);
    WIDGETS[id] = WIDGETS[id] || descriptor;
  }

  return {
    forField:          typesForField,
    defaultWidgetId:   defaultWidgetId,
    optionsForWidget:  optionsForWidget,
    widgetTemplate:    widgetTemplate,
    paramDefaults:     paramDefaults,
    registerWidget:    registerWidget
  };

}]);
