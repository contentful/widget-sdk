'use strict';

angular.module('contentful').controller('CfValidationErrorDisplayCtrl', function CfValidationErrorDisplayCtrl($scope, $attrs) {
  $scope.errorMessages = [];

  var messages = {
    linkContentType: function(v) {
      var ct = _.find($scope.spaceContext.publishedContentTypes, function(ct) {
        return ct.getId() === v.contentTypeId;
      });
      if (!ct) return 'Invalid Content Type';
      return 'Linked entry\'s Content Type must be ' + ct.getName() + '.';
    },
    size: function (v) {
      var data = getData(v);
      var type = _.isString(data) ? 'Length' : 'Size';

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
      } else {
        return 'Required';
      }
    },
    type: function(v) {
      if (v.type == 'Validation') {
        return v.details;
      } else if (v.type.match(/^aeio/i)) {
        return 'Must be an ' + v.type + '.';
      } else {
        return 'Must be a ' + v.type + '.';
      }
    }
  };

  function toErrorMessage(error) {
    if (!messages[error.name]) return 'Error: ' + error.name;
    return messages[error.name](error);
  }

  var NO_DATA = {};

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
});
