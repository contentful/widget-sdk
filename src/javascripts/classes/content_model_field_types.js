'use strict';

angular.module('contentful').constant('contentModelFieldTypes', {
  Symbol: {
    jsonType: 'String',
    description: 'Basic list of characters. Maximum length is 256.'
  },
  Text: {
    jsonType: 'String',
    description: 'Basic list of characters. Filterable via full-text search. Maximum length is 50,000.'
  },
  Integer: {
    jsonType: 'Number',
    description: 'Number type without decimals. Values from -2^53 to 2^53.'
  },
  Number: {
    jsonType: 'Number',
    description: 'Number type with decimals.'
  },
  Date: {
    jsonType: 'String',
    description: 'Date/Time in ISO 8601 format.'
  },
  Boolean: {
    jsonType: 'Boolean',
    description: 'Flag, true or false.'
  },
  Link: {
    jsonType: 'Object',
    description: 'A reference to an entry or asset. The type of the referenced item is defined by the linkType property.'
  },
  Array: {
    jsonType: 'Array',
    description: 'List of values. Value type depends on field.items.type.'
  },
  Location: {
    jsonType: 'Object',
    description: 'Object with longitude and latitude.'
  },
  Object: {
    jsonType: 'Object',
    description: 'Arbitrary Object.'
  }
});
