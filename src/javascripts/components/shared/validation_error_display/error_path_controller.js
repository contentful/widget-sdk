'use strict';

angular.module('contentful')
.controller('ErrorPathController', ['$scope', '$attrs', 'mimetype',
function ErrorPathController($scope, $attrs, mimetype) {
  var controller = this;
  controller.messages = [];

  var messages = {
    linkMimetypeGroup: function (error) {
      var mimetypeGroupName = mimetype.getGroupNames()[error.mimetypeGroupName];
      return 'Linked Asset file type must be ' + mimetypeGroupName + '.';
    },

    linkContentType: function(error, _, spaceContext) {
      var ct = spaceContext.getPublishedContentType(error.contentTypeId);
      if (!ct)
        return 'Invalid Content Type';
      else
        return 'Linked Entry\'s Content Type must be ' + ct.getName() + '.';
    },

    size: function (error, validatedData) {
      var entityType = getEntityType(validatedData);
      var data = dotty.get(validatedData, error.path);
      var type = _.isString(data) ? 'Length' : 'Size';
      if (entityType === 'ContentType' && error.path[0] === 'fields')
        type = 'Number of fields';

      if (_.isNumber(error.min) && _.isNumber(error.max)) {
        return type + ' must be between ' + error.min + ' and ' + error.max + '.';
      } else if(_.isNumber(error.min)) {
        return type + ' must be at least ' + error.min + '.';
      } else {
        return type + ' must be at most ' + error.max + '.';
      }
    },

    range: function (error) {
      if (_.isNumber(error.min) && _.isNumber(error.max)) {
        return 'Must be between ' + error.min + ' and ' + error.max + '.';
      } else if(_.isNumber(error.min)) {
        return 'Must be at least ' + error.min + '.';
      } else {
        return 'Must be at most ' + error.max + '.';
      }
    },

    regexp: function (error) {
      if (error.path[1] === 'file' && error.path[3] === 'url') {
        return 'Has an invalid url';
      } else {
        return 'Has an invalid format.';
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

  function defaultMessage(error) {
    if (error.details)
      return error.details;
    else
      return 'Error: ' + error.name;
  }

  function customMessage(error) {
    return error.customMessage;
  }

  function getErrorMessage(error, validatedData, spaceContext) {
    var getMessage;
    if (error.customMessage)
      getMessage = customMessage;
    else
      getMessage = messages[error.name] || defaultMessage;
    return getMessage(error, validatedData, spaceContext);
  }

  function getEntityType(object) {
    return object && object.sys && object.sys.type;
  }

  function matchesPath(pattern, target) {
    var prefixLen = pattern.length - 1;
    if (pattern[prefixLen] === '*') {
      return _.isEqual(target.slice(0, prefixLen), pattern.slice(0, prefixLen));
    } else {
      return _.isEqual(target, pattern);
    }
  }

  var unwatchValidationErrors = $scope.$watch('validationResult.errors', function(errors) {
    var pathPattern = $scope.$eval($attrs.cfErrorPath);

    var fieldErrors = _.filter(errors, function(error) {
      return matchesPath(pathPattern, error.path);
    });

    controller.messages = fieldErrors.map(function(error) {
      return getErrorMessage(error, $scope.validationResult.data, $scope.spaceContext);
    });

    var hasErrors = fieldErrors.length > 0;
    controller.hasErrors = hasErrors;
    controller.isEmpty = !hasErrors;
  });

  $scope.$on('$destroy', function () {
    unwatchValidationErrors();
    unwatchValidationErrors = null;
  });
}]);
