'use strict';

angular.module('contentful').directive('selectType', ['availableFieldTypes', function (availableFieldTypes) {
  return {
    template: JST['select_type'](),
    link: function (scope, elem, attr) {
      scope.availableTypes = _.groupBy(availableFieldTypes, 'group');
      scope.typeClicked = function (type) {
        scope.$eval(attr.selectType, {type: type});
      };
    }
  };
}]);
