angular.module('contentful').
  constant('availableFieldTypes', [
    {
      name: 'Text',
      description: 'Text description',
      value: {type: 'text'}
    },
    {
      name: 'Symbol',
      description: 'Symbol description',
      value: {type: 'string'}
    },
    {
      name: 'Integer',
      description: 'Integer description',
      value: {type: 'integer'}},
    {
      name: 'Floating-point',
      description: 'Floating-point description',
      value: {type: 'number'}
    },
    {
      name: 'Yes/No',
      description: 'Yes/No description',
      value: {type: 'boolean'}
    },
    {
      name: 'Date/Time',
      description: 'Date/Time description',
      value: {type: 'date'}
    },
    {
      name: 'Object',
      description: 'Object description',
      value: {type: 'object'}
    },
    {
      name: 'Link to Entry',
      description: 'Link to Entry description',
      value: {type: 'link'}
    },
    {
      name: 'List of Entries',
      description: 'List of Entries description',
      value: {type: 'array', items: {type: 'link'}}
    },
    {
      name: 'List of Strings',
      description: 'List of Strings description',
      value: {type: 'array' , items: {type: 'string'}}
    },
    {
      name: 'Location',
      description: 'Location description',
      value: {type: 'location'}
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
