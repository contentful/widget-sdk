'use strict';

angular.module('contentful').directive('cfEmptyList', function () {
  return {
    require: 'ngModel',
    priority: 100,
    restrict: 'A',
    link: function (scope, elem, attr, ngModelCtrl) {
      ngModelCtrl.$parsers.push(function(list){
        if (_.isArray(list) && list.length === 0) return null;
        else return list;
      });
    }
  };
});

