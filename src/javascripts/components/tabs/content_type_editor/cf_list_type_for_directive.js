'use strict';

angular.module('contentful').directive('cfListTypeFor', function () {
  return {
    require: 'ngModel',
    priority: 101, // Right above ng-list
    link: function (scope, elem, attr, ngModel) {
      ngModel.$parsers.push(function (viewValue) {
        var field = scope.$eval(attr.cfListTypeFor);
        if (field.type === 'Number') {
          return _.map(viewValue, function (s) { return parseFloat(s, 10); });
        } else if (field.type === 'Integer') {
          return _.map(viewValue, function (s) { return parseInt(s, 10); });
        } else {
          return viewValue;
        }
      });
    }
  };
});

