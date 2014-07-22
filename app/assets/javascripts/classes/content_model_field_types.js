angular.module('contentful').constant('contentModelFieldTypes', {
  Symbol: {
    jsonType: 'String',
    description: 'Basic list of characters. Maximum length is 256.'
  },
  Text: {
    jsonType: 'String',
    description: 'Same as Symbol, but can be filtered via <a href="https://www.contentful.com/developers/documentation/content-delivery-api/#search-filter-full-text">Full-Text Search</a>. Maximum length is 50,000.'
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
    description: 'See <a href="https://www.contentful.com/developers/documentation/content-delivery-api/#date-time-format">Date & Time Format</a>.'
  },
  Boolean: {
    jsonType: 'Boolean',
    description: 'Flag, true or false.'
  },
  Link: {
    jsonType: 'Object',
    description: 'See <a href="https://www.contentful.com/developers/documentation/content-delivery-api/#links">Links<a/>.'
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
