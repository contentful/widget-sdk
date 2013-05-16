angular.module('contentful').
  constant('availableFieldTypes', [
    {name: 'Text'           , value: {type: 'text'                            }},
    {name: 'Symbol'         , value: {type: 'string'                          }},
    {name: 'Integer'        , value: {type: 'integer'                         }},
    {name: 'Floating-point' , value: {type: 'number'                          }},
    {name: 'Yes/No'         , value: {type: 'boolean'                         }},
    {name: 'Date/Time'      , value: {type: 'date'                            }},
    {name: 'Object'         , value: {type: 'object'                          }},
    {name: 'Link to Entry'  , value: {type: 'link'                            }},
    {name: 'List of Entries', value: {type: 'array' , items: {type: 'link'  } }},
    {name: 'List of Strings', value: {type: 'array' , items: {type: 'string'} }},
    {name: 'Location'       , value: {type: 'location'                        }}
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
