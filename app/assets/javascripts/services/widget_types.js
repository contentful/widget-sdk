'use strict';
angular.module('contentful').factory('widgetTypes', ['$injector', function($injector){
  var $q = $injector.get('$q');

  var WIDGET_TYPES = {
    Text: [
      'singleLine',
      'multipleLine',
      'markdown',
      'dropdown',
      'radio'
    ],
    Symbol: [
      'singleLine',
      'dropdown',
      'radio'
    ],
    Integer: [
      'singleLine',
      'dropdown',
      'radio',
      'rating'
    ],
    Number: [
      'singleLine',
      'dropdown',
      'radio',
      'rating'
    ],
    Boolean: [
      'radio',
      'toggle',
      'dropdown'
    ],
    Date: [
      'datePicker',
      'dateDropdown'
    ],
    Location: [
      'coordinates'
    ],
    Entry: [
      'item',
      'card'
    ],
    Asset: [
      'item',
      'gallery'
    ],
    Object: [
      'multipleLine'
    ],
    Array: [
      'list'
    ]
  };

  var WIDGET_OPTIONS = {
    singleLine: {
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
    }
  };

  return {
    forFieldType: function (fieldType) {
      var widgetTypes = _.map(WIDGET_TYPES[fieldType], function (widgetType) {
        return {
          id: widgetType,
          name: WIDGET_OPTIONS[widgetType].name
        };
      });
      return $q.when(widgetTypes);
    },

    options: function (widgetType) {
      return $q.when(WIDGET_OPTIONS[widgetType].fields);
    }
  };

}]);
