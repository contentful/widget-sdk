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
      name: 'Integer',
      description: 'Integer description',
      value: {type: 'Integer'}},
    {
      name: 'Floating-point',
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
      value: {type: 'Link'}
    },
    {
      name: 'List of Entries',
      description: 'List of Entries description',
      value: {type: 'Array', items: {type: 'Link'}}
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
      return _.find(availableFieldTypes, function(availableFieldType) {
        if (field.type !== availableFieldType.value.type)
          return false;
        if (field.items && field.items.type !== availableFieldType.value.items.type)
          return false;
        return true;
      }).name;
    };
  });
