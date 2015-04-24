'use strict';

angular.module('contentful').directive('cfSelectType', ['availableFieldTypes', function (availableFieldTypes) {
  return {
    template: JST.select_type(),
    restrict: 'E',
    link: function (scope, elem, attr) {
      scope.availableTypes = _.groupBy(availableFieldTypes, 'group');
      scope.typeClicked = function (type) {
        scope.$eval(attr.onTypeSelected, {type: type});
      };
    }
  };
}]);
