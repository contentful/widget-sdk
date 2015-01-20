'use strict';
angular.module('contentful').
  constant('availableFieldTypes', [
    {
      name: 'Text',
      description: 'Text description',
      group: 'Single',
      value: {type: 'Text'}
    },
    {
      name: 'Symbol',
      description: 'Symbol description',
      group: 'Single',
      value: {type: 'Symbol'}
    },
    {
      name: 'Number',
      description: 'Integer description',
      group: 'Single',
      value: {type: 'Integer'}
    },
    {
      name: 'Decimal Number',
      description: 'Floating-point description',
      group: 'Single',
      value: {type: 'Number'}
    },
    {
      name: 'Yes/No',
      description: 'Yes/No description',
      group: 'Single',
      value: {type: 'Boolean'}
    },
    {
      name: 'Date/Time',
      description: 'Date/Time description',
      group: 'Single',
      value: {type: 'Date'}
    },
    {
      name: 'Location',
      group: 'Single',
      description: 'Location description',
      value: {type: 'Location'}
    },
    {
      name: 'Entry',
      description: 'Link to Entry description',
      group: 'Single',
      value: {type: 'Link', linkType: 'Entry'}
    },
    {
      name: 'Asset',
      description: 'Link to Asset description',
      group: 'Single',
      value: {type: 'Link', linkType: 'Asset'}
    },
    {
      name: 'Object',
      description: 'Object description',
      group: 'Single',
      value: {type: 'Object'}
    },
    {
      name: 'Entries',
      description: 'List of Entries description',
      group: 'Multiple',
      value: {type: 'Array', items: {type: 'Link', linkType: 'Entry'}}
    },
    {
      name: 'Assets',
      description: 'List of Assets description',
      group: 'Multiple',
      value: {type: 'Array', items: {type: 'Link', linkType: 'Asset'}}
    },
    {
      name: 'Symbols',
      description: 'List of Symbols description',
      group: 'Multiple',
      value: {type: 'Array' , items: {type: 'Symbol'}}
    }
  ]).
  factory('getFieldTypeName', ['availableFieldTypes', function(availableFieldTypes) {
    return function(field) {
      return _.result(_.find(availableFieldTypes, function(availableFieldType) {
        var fieldItemsType = dotty.get(field, 'items.type');
        var fieldType = dotty.get(field, 'type');
        if (!field ||
            fieldType !== dotty.get(availableFieldType, 'value.type') ||
            fieldType === 'Link' && dotty.get(field, 'linkType') !== dotty.get(availableFieldType, 'value.linkType') ||
            fieldItemsType !== dotty.get(availableFieldType, 'value.items.type') ||
            fieldType === 'Array' && fieldItemsType === 'Link' && dotty.get(field, 'items.linkType') !== dotty.get(availableFieldType, 'value.items.linkType')
           )
          return false;
        return true;
      }), 'name');
    };
  }]);
