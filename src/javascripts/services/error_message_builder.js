'use strict';

angular.module('contentful')
.factory('errorMessageBuilder', ['$injector', function ($injector) {
  var joinAnd = $injector.get('stringUtils').joinAnd;
  var mimetypeGroupNames = $injector.get('mimetype').getGroupNames();

  var messages = {
    linkMimetypeGroup: function (error) {
      var labels = _.map(error.mimetypeGroupName, function (name) {
        return '“' + mimetypeGroupNames[name] + '”';
      });
      return '' + joinAnd(labels) + ' are the only acceptable file types';
    },

    linkContentType: function(error, _, spaceContext) {
      var ct = spaceContext.getPublishedContentType(error.contentTypeId);
      if (!ct)
        return 'Invalid Content Type';
      else
        return 'Linked Entry\'s Content Type must be ' + ct.getName() + '.';
    },

    size: function (error, validatedData) {
      var min = error.min;
      var max = error.max;
      var data = dotty.get(validatedData, error.path);
      if (_.isString(data))
        return stringLengthMessage(min, max);

      var entityType = getEntityType(validatedData);
      var itemsName = ' items';
      if (entityType === 'ContentType' && error.path[0] === 'fields')
        itemsName = ' fields';

      if (_.isNumber(min) && _.isNumber(max)) {
        return 'Please provide between ' + min + ' and ' + max + itemsName;
      } else if(_.isNumber(min)) {
        return 'Please provide at least ' + min + itemsName;
      } else {
        return 'Please provide at most ' + max + itemsName;
      }
    },

    range: function (error) {
      if (_.isNumber(error.min) && _.isNumber(error.max)) {
        return 'Please enter a number between ' + error.min + ' and ' + error.max;
      } else if(_.isNumber(error.min)) {
        return 'Please enter a number no less than ' + error.min;
      } else {
        return 'Please enter a number no greater than ' + error.max;
      }
    },

    dateRange: function (error) {
      var dateFormat = 'lll';
      var min = error.min && moment(error.min).format(dateFormat);
      var max = error.max && moment(error.max).format(dateFormat);

      if (min && max ) {
        return 'Please set a date between ' + min + ' and ' +  max;
      } else if (min) {
        return 'Please set a time no earlier than ' + min;
      } else {
        return 'Please set a time no later than ' + max;
      }
    },

    regexp: function (error) {
      if (error.path[1] === 'file' && error.path[3] === 'url') {
        return 'Has an invalid url';
      } else {
        return 'Input does not match the expected format. Please edit and try again.';
      }
    },

    'in': function (error) {
      return 'Must be one of ' + error.expected.join(', ') + '.';
    },

    required: function(error) {
      if (error.path.length == 1 && error.path[0] == 'fields') {
        return 'All fields are empty. Please fill out some fields.';
      } else if (error.path.length == 4 && error.path[1] == 'file' && error.path[3] == 'url') {
        return 'Cannot publish until processing has finished.';
      } else {
        return 'Required';
      }
    },

    type: function(error) {
      if (error.details && (error.type == 'Validation' || error.type == 'Text')) {
        return error.details;
      } else if (error.type.match(/^aeio/i)) {
        return 'Must be an ' + error.type + '.';
      } else {
        return 'Must be a ' + error.type + '.';
      }
    },

    uniqueFieldIds: function () {
      return 'Field ID must be unique';
    },

    notResolvable: function (error, validatedData) {
      var type = dotty.get(validatedData, error.path.concat('sys', 'linkType'));
      return 'Linked ' + type + ' does not exist';
    },

    unknown: function (error) {
      if (error.path.length == 3 && error.path[0] == 'fields') {
        return 'This field is not localized and should not contain a value.';
      } else if (error.path.length == 2 && error.path[0] == 'fields') {
        return 'Unknown field.';
      } else {
        return 'Unkown property.';
      }
    }
  };

  function stringLengthMessage (min, max) {
    if (_.isNumber(min) && _.isNumber(max)) {
      return 'Please edit the text so it\'s between ' + min + ' and ' + max + ' characters long';
    } else if(_.isNumber(min)) {
      return 'Please expand the text so it\'s no shorter than ' + min + ' characters';
    } else {
      return 'Please shorten the text so it\'s no longer than ' + max + ' characters';
    }
  }

  function getEntityType(object) {
    return object && object.sys && object.sys.type;
  }

  function defaultMessage(error) {
    if (error.details)
      return error.details;
    else
      return 'Error: ' + error.name;
  }

  function customMessage(error) {
    return error.customMessage;
  }

  function buildErrorMessage(error, validatedData, spaceContext) {
    var getMessage;
    if (error.customMessage)
      getMessage = customMessage;
    else
      getMessage = messages[error.name] || defaultMessage;
    return getMessage(error, validatedData, spaceContext);
  }

  return buildErrorMessage;
}]);
