'use strict';
angular.module('contentful').factory('widgetTypes', ['$injector', function($injector){
  var $q = $injector.get('$q');

  var WIDGET_TYPES = {
    'Text': [
      'singleLine',
      'multipleLine',
      'markdown',
      'dropdown',
      'radio'
    ],
    'Symbol': [
      'singleLine',
      'dropdown',
      'radio'
    ],
    'Symbols': [
      'listInput'
    ],
    'Integer': [
      'numberEditor',
      'dropdown',
      'radio',
      'rating'
    ],
    'Number': [
      'numberEditor',
      'dropdown',
      'radio',
      'rating'
    ],
    'Boolean': [
      'radio',
      'toggle',
      'dropdown'
    ],
    'Date': [
      'datePicker',
      'dateDropdown'
    ],
    'Location': [
      'locationEditor'
    ],
    'Link': [
      'linkEditor',
      'item',
      'card'
    ],
    'Links': [
      'linksEditor'
    ],
    'File': [
      'item',
      'gallery'
    ],
    'Object': [
      'objectEditor'
    ]
  };

  var WIDGET_PARAMS = {
    singleLine: {
      name: 'Single Line',
      fields: {}
    },
    numberEditor: {
      name: 'Single Line',
      fields: {}
    },
    multipleLine: {
      name: 'Multiple Line',
      fields: {}
    },
    markdown: {
      name: 'Markdown',
      fields: {}
    },
    dropdown: {
      name: 'Dropdown',
      fields: {}
    },
    radio: {
      name: 'Radio',
      fields: {}
    },
    rating: {
      name: 'Rating',
      fields: {}
    },
    toggle: {
      name: 'Toggle',
      fields: {}
    },
    datePicker: {
      name: 'Date Picker',
      fields: {}
    },
    dateDropdown: {
      name: 'Date Dropdown',
      fields: {}
    },
    locationEditor: {
      name: 'Location',
      fields: {}
    },
    coordinates: {
      name: 'Coordinates',
      fields: {}
    },
    item: {
      name: 'Item',
      fields: {}
    },
    card: {
      name: 'Card',
      fields: {}
    },
    gallery: {
      name: 'Gallery',
      fields: {}
    },
    list: {
      name: 'List',
      fields: {}
    },
    objectEditor: {
      name: 'Object',
      fields: {}
    },
    listInput: {
      name: 'List',
      fields: {}
    },
    fileEditor: {
      name: 'File',
      fields: {}
    },
    linkEditor: {
      name: 'Link',
      fields: {}
    },
    linksEditor: {
      name: 'Links',
      fields: {}
    }
  };

  function forField(field) {
    var type = detectArrayLinkType(field);
    if(!(type in WIDGET_TYPES)) {
      return $q.reject(new Error('Field type '+type+' is not supported.'));
    }
    var widgetTypes = _.map(WIDGET_TYPES[type], function (widgetType) {
      return {
        id: widgetType,
        name: WIDGET_PARAMS[widgetType].name
      };
    });
    return $q.when(widgetTypes);
  }

  function widgetParams(widgetType) {
    if(!(widgetType in WIDGET_PARAMS))
      return $q.reject(new Error('Widget type '+widgetType+' is not supported.'));
    return $q.when(WIDGET_PARAMS[widgetType].fields);
  }

  function forFieldWithContentType(field, contentType) {
    var type = detectArrayLinkType(field);
    var widgetTypes = WIDGET_TYPES[type];
    var hasValidations = getFieldValidationsOfType(field, 'in').length > 0;
    if(hasValidations && _.contains(widgetTypes, 'radio')) return 'radio';
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
    if(widgetTypes && widgetTypes.length > 0)
      return widgetTypes[0];
    return null;
  }

  function detectArrayLinkType(field) {
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
    forField: forField,
    forFieldWithContentType: forFieldWithContentType,
    params: widgetParams
  };

}]);
