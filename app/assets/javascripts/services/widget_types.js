'use strict';
angular.module('contentful').factory('widgetTypes', ['$injector', function($injector){
  var $q = $injector.get('$q');

  var COMMON_OPTIONS = [
    {param: 'helpText', name: 'Help text', description: 'This help text will show up below the field'}
  ];

  var WIDGETS = {
    singleLine: {
      fieldTypes: ['Text', 'Symbol'],
      name: 'Single Line',
    },
    numberEditor: {
      fieldTypes: ['Integer', 'Number'],
      name: 'Single Line',
    },
    multipleLine: {
      fieldTypes: ['Text'],
      name: 'Multiple Line',
    },
    markdown: {
      fieldTypes: ['Text'],
      name: 'Markdown',
    },
    dropdown: {
      fieldTypes: ['Text', 'Symbol', 'Integer', 'Number', 'Boolean'],
      name: 'Dropdown',
    },
    radio: {
      fieldTypes: ['Text', 'Symbol', 'Integer', 'Number', 'Boolean'],
      name: 'Radio',
    },
    rating: {
      fieldTypes: ['Integer', 'Number'],
      name: 'Rating',
      options: [
        {param: 'stars', name: 'Number of stars', default: 10}
      ]
    },
    toggle: {
      fieldTypes: ['Boolean'],
      name: 'Toggle',
    },
    datePicker: {
      fieldTypes: ['Date'],
      name: 'Date Picker',
    },
    dateDropdown: {
      fieldTypes: ['Date'],
      name: 'Date Dropdown',
    },
    locationEditor: {
      fieldTypes: ['Location'],
      name: 'Location',
    },
    coordinates: {
      fieldTypes: ['Location'],
      name: 'Coordinates',
    },
    item: {
      fieldTypes: ['Link', 'File'],
      name: 'Item',
    },
    card: {
      fieldTypes: ['Link'],
      name: 'Card',
    },
    gallery: {
      fieldTypes: ['File'],
      name: 'Gallery',
    },
    //list: {
      //name: 'List',
    //},
    objectEditor: {
      fieldTypes: ['Object'],
      name: 'Object',
    },
    listInput: {
      fieldTypes: ['Symbols'],
      name: 'List',
    },
    //fileEditor: {
      //name: 'File',
      //fields: {}
    //},
    linkEditor: {
      fieldTypes: ['Link'],
      name: 'Link',
    },
    linksEditor: {
      fieldTypes: ['Links'],
      name: 'Links',
    }
  };

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

  return {
    forField: widgetsForField,
    defaultType: defaultWidgetType,
    optionsForWidget: optionsForWidget
  };

}]);
