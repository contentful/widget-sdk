'use strict';

angular.module('contentful').factory('availableValidations', function (validation) {
  var validations = {
    'Size': {size: {min: null, max: null}},
    'Range': {range: {min: null, max: null}},
    'Regular Expression': {regexp: {pattern: null, flags: null}},
    'One of': {'in': null} ,
    'Content Type': {linkContentType: null},
    'File Type': {linkMimetypeGroup: null}
  };

  function validationType(validation) {
    return _(validation).keys().filter(function(k) { return k !== '$$hashKey'; }).value()[0];
  }

  function validationName(validation) {
    var type = validationType(validation);
    return _(validations).findKey(function (val) {
      return val.hasOwnProperty(type);
    });
  }

  return {
    all: validations,
    
    forField: function (field) {
      var type = field.type === 'Array' ?  field.items : field;
      var typeValidationKeys = validation.Validation.perType(type);
      return _.pick(validations, function(val) {
        var key = validationType(val);
        return _.contains(typeValidationKeys, key);
      });
    },

    type: validationType,

    name: validationName
  };
});
