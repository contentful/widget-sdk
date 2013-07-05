angular.module('contentful').directive('newFieldForm', function () {
  'use strict';

  return {
    restrict: 'C',
    controller: 'newFieldFormCtrl',
    link: function (scope, elem) {
      scope.$on('fieldAdded', function () {
        elem.find('input').eq(0).focus();
      });
    }
  };
});
