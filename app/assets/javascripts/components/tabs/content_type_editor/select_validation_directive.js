'use strict';

angular.module('contentful').directive('selectValidation', function () {
  return {
    template: JST['select_validation'](),
    link: function (scope, elem, attr) {
      scope.typeClicked = function (type) {
        scope.$eval(attr.selectValidation, {type: type});
      };
    }
  };
});
