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

  var WIDGET_OPTIONS = {
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

  function forFieldType(fieldType) {
    var widgetTypes = _.map(WIDGET_TYPES[fieldType], function (widgetType) {
      return {
        id: widgetType,
        name: WIDGET_OPTIONS[widgetType].name
      };
    });
    return $q.when(widgetTypes);
  }

  function widgetOptions(widgetType) {
    return $q.when(WIDGET_OPTIONS[widgetType].fields);
  }

  function forFieldWithContentType(field, contentType) {
    var type = field.type === 'Array' ? linkTypeForArray(field.items.type) : field.type;
    var widgetTypes = WIDGET_TYPES[type];
    var hasValidations = getFieldValidationsOfType(field, 'in').length > 0;
    if(hasValidations && _.contains(widgetTypes, 'dropdown')) return 'dropdown';
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

  function linkTypeForArray(type) {
    if (type === 'Link'  ) return 'Links';
    if (type === 'Symbol') return 'Symbols';
    return null;
  }

  function getFieldValidationsOfType(field, type) {
    return _.filter(_.pluck(field.validations, type));
  }

  return {
    forField: forFieldWithContentType,
    forFieldType: forFieldType,
    options: widgetOptions
  };

}]);
