angular.module('contentful').
  constant('availableFieldTypes', [
    {
      name: 'Text',
      description: 'Text description',
      value: {type: 'Text'}
    },
    {
      name: 'Symbol',
      description: 'Symbol description',
      value: {type: 'Symbol'}
    },
    {
      name: 'Number',
      description: 'Integer description',
      value: {type: 'Integer'}},
    {
      name: 'Decimal Number',
      description: 'Floating-point description',
      value: {type: 'Number'}
    },
    {
      name: 'Yes/No',
      description: 'Yes/No description',
      value: {type: 'Boolean'}
    },
    {
      name: 'Date/Time',
      description: 'Date/Time description',
      value: {type: 'Date'}
    },
    {
      name: 'Object',
      description: 'Object description',
      value: {type: 'Object'}
    },
    {
      name: 'Link to Entry',
      description: 'Link to Entry description',
      value: {type: 'Link', linkType: 'Entry'}
    },
    {
      name: 'Link to Asset',
      description: 'Link to Asset description',
      value: {type: 'Link', linkType: 'Asset'}
    },
    {
      name: 'List of Entries',
      description: 'List of Entries description',
      value: {type: 'Array', items: {type: 'Link', linkType: 'Entry'}}
    },
    {
      name: 'List of Assets',
      description: 'List of Assets description',
      value: {type: 'Array', items: {type: 'Link', linkType: 'Asset'}}
    },
    {
      name: 'List of Symbols',
      description: 'List of Symbols description',
      value: {type: 'Array' , items: {type: 'Symbol'}}
    },
    {
      name: 'Location',
      description: 'Location description',
      value: {type: 'Location'}
    }
  ]).
  factory('getFieldTypeName', function(availableFieldTypes) {
    'use strict';

    return function(field) {
      return _.result(_.find(availableFieldTypes, function(availableFieldType) {
        if (!field ||
            field.type !== availableFieldType.value.type ||
            field.type === 'Link' && field.linkType !== availableFieldType.value.linkType ||
            field.items && field.items.type !== availableFieldType.value.items.type ||
            field.type === 'Array' && field.items.type === 'Link' && field.items.linkType !== availableFieldType.value.items.linkType
           )
          return false;
        return true;
      }), 'name');
    };
  });
