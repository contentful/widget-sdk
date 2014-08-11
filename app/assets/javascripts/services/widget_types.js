'use strict';
angular.module('contentful').factory('widgetTypes', ['$injector', function($injector){
  var $q = $injector.get('$q');

  var WIDGET_PARAMS = {
    singleLine: {
      fieldTypes: ['Text', 'Symbol'],
      name: 'Single Line',
      fields: {}
    },
    numberEditor: {
      fieldTypes: ['Integer', 'Number'],
      name: 'Single Line',
      fields: {}
    },
    multipleLine: {
      fieldTypes: ['Text'],
      name: 'Multiple Line',
      fields: {}
    },
    markdown: {
      fieldTypes: ['Text'],
      name: 'Markdown',
      fields: {}
    },
    dropdown: {
      fieldTypes: ['Text', 'Symbol', 'Integer', 'Number', 'Boolean'],
      name: 'Dropdown',
      fields: {}
    },
    radio: {
      fieldTypes: ['Text', 'Symbol', 'Integer', 'Number', 'Boolean'],
      name: 'Radio',
      fields: {}
    },
    rating: {
      fieldTypes: ['Integer', 'Number'],
      name: 'Rating',
      fields: {
      }
    },
    toggle: {
      fieldTypes: ['Boolean'],
      name: 'Toggle',
      fields: {}
    },
    datePicker: {
      fieldTypes: ['Date'],
      name: 'Date Picker',
      fields: {}
    },
    dateDropdown: {
      fieldTypes: ['Date'],
      name: 'Date Dropdown',
      fields: {}
    },
    locationEditor: {
      fieldTypes: ['Location'],
      name: 'Location',
      fields: {}
    },
    coordinates: {
      fieldTypes: ['Location'],
      name: 'Coordinates',
      fields: {}
    },
    item: {
      fieldTypes: ['Link', 'File'],
      name: 'Item',
      fields: {}
    },
    card: {
      fieldTypes: ['Link'],
      name: 'Card',
      fields: {}
    },
    gallery: {
      fieldTypes: ['File'],
      name: 'Gallery',
      fields: {}
    },
    //list: {
      //name: 'List',
      //fields: {}
    //},
    objectEditor: {
      fieldTypes: ['Object'],
      name: 'Object',
      fields: {}
    },
    listInput: {
      fieldTypes: ['Symbols'],
      name: 'List',
      fields: {}
    },
    //fileEditor: {
      //name: 'File',
      //fields: {}
    //},
    linkEditor: {
      fieldTypes: ['Link'],
      name: 'Link',
      fields: {}
    },
    linksEditor: {
      fieldTypes: ['Links'],
      name: 'Links',
      fields: {}
    }
  };

  function widgetsForField(field) {
    var fieldType = detectFieldType(field);
    var widgets =  _(WIDGET_PARAMS)
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

  function widgetParams(widgetType) {
    if(!(widgetType in WIDGET_PARAMS))
      return $q.reject(new Error('Widget type '+widgetType+' is not supported.'));
    return $q.when(WIDGET_PARAMS[widgetType].fields);
  }

  function defaultWidgetType(field, contentType) {
    var type = detectFieldType(field);
    var hasValidations = getFieldValidationsOfType(field, 'in').length > 0;
    if(hasValidations && _.contains(WIDGET_PARAMS['dropdown'].fieldTypes, type)) return 'dropdown';
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

    return _.findKey(WIDGET_PARAMS, function (widget) {
      return _.contains(widget.fieldTypes, type);
    });
  }

  function detectFieldType(field) {
    var type = field.type;
    if(type === 'Array'){
      var itemsType = field.items.type;
      if (itemsType === 'Link'  ) return 'Links';
      if (itemsType === 'Symbol') return 'Symbols';
    }
    return type;
  }

  function getFieldValidationsOfType(field, type) {
    return _.pluck(field.validations, type);
  }

  return {
    forField: widgetsForField,
    defaultType: defaultWidgetType,
    params: widgetParams
  };

}]);
