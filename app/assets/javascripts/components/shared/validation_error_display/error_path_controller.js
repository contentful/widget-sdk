'use strict';

angular.module('contentful').controller('ErrorPathController', ['$scope', '$attrs', 'mimetype', function ErrorPathController($scope, $attrs, mimetype) {
  $scope.errorMessages = [];

  var messages = {
    linkMimetypeGroup: function (v) {
      return 'Linked Asset file type must be ' + mimetype.groupDisplayNames[v.mimetypeGroupName] + '.';
    },
    linkContentType: function(v) {
      var ct = $scope.spaceContext.getPublishedContentType(v.contentTypeId);
      if (!ct) return 'Invalid Content Type';
      return 'Linked Entry\'s Content Type must be ' + ct.getName() + '.';
    },
    size: function (v) {
      var data = getData(v);
      var type = _.isString(data) ? 'Length' : 'Size';
      if (getEntityType(v) === 'ContentType' && v.path[0] === 'fields') type = 'Number of fields';

      if (_.isNumber(v.min) && _.isNumber(v.max)) {
        return type + ' must be between ' + v.min + ' and ' + v.max + '.';
      } else if(_.isNumber(v.min)) {
        return type + ' must be at least ' + v.min + '.';
      } else {
        return type + ' must be at most ' + v.max + '.';
      }
    },
    range: function (v) {
      if (_.isNumber(v.min) && _.isNumber(v.max)) {
        return 'Must be between ' + v.min + ' and ' + v.max + '.';
      } else if(_.isNumber(v.min)) {
        return 'Must be at least ' + v.min + '.';
      } else {
        return 'Must be at most ' + v.max + '.';
      }
    },
    regexp: function (v) {
      if (v.path[1] === 'file' && v.path[3] === 'url') {
        return 'Has an invalid url';
      } else {
        return 'Has an invalid format.';
      }
    },
    'in': function (v) {
      return 'Must be one of ' + v.expected.join(', ') + '.';
    },
    required: function(v) {
      if (v.path.length == 1 && v.path[0] == 'fields') {
        return 'All fields are empty. Please fill out some fields.';
      } else if (v.path.length == 4 && v.path[1] == 'file' && v.path[3] == 'url') {
        return 'Cannot publish until processing has finished.';
      } else {
        return 'Required';
      }
    },
    type: function(v) {
      if (v.details && (v.type == 'Validation' || v.type == 'Text')) {
        return v.details;
      } else if (v.type.match(/^aeio/i)) {
        return 'Must be an ' + v.type + '.';
      } else {
        return 'Must be a ' + v.type + '.';
      }
    },
    uniqueFieldIds: function () {
      return 'Field ID must be unique';
    },
    unknown: function (v) {
      if (v.path.length == 3 && v.path[0] == 'fields') {
        return 'This field is not localized and should not contain a value.';
      } else if (v.path.length == 2 && v.path[0] == 'fields') {
        return 'Unknown field.';
      } else {
        return 'Unkown property.';
      }
    }
  };

  function toErrorMessage(error) {
    if (!messages[error.name]) return 'Error: ' + error.name;
    return messages[error.name](error);
  }

  var NO_DATA = {};

  function getEntityType(error) {
    var object = $scope.validationResult.data;
    return object && object.sys && object.sys.type;
  }

  function getData(error) {
    var object = $scope.validationResult.data;
    var path = error.path.concat();
    while (path.length > 0) {
      var pathSeg = path.shift();
      if (_.isObject(object) && object.hasOwnProperty(pathSeg)) {
        object = object[pathSeg];
      } else {
        return NO_DATA;
      }
    }
    return object;
  }

  function matches(errorPath, path) {
    if (path[path.length-1] === '*') {
      var prefixLen = path.length - 1;
      return _.isEqual(errorPath.slice(0, prefixLen), path.slice(0, prefixLen));
    } else {
      return _.isEqual(errorPath, path);
    }
  }

  var unwatch = $scope.$watch('validationResult.errors', function(errors) {
    var path = $scope.$eval($attrs.cfErrorPath);

    var fieldErrors = _.filter(errors, function(error) {
      return matches(error.path, path);
    });
    $scope.errorMessages = fieldErrors.map(toErrorMessage);
  });

  $scope.$on('$destroy', function () {
    unwatch();
    unwatch = null;
  });
}]);
