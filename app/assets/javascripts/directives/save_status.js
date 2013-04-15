'use strict';

angular.module('contentful/directives').directive('saveStatus', function () {
  return {
    restrict: 'C',
    template: JST['save_status'](),
    controller: 'SaveStatusCtrl',
    link: function (scope, elem) {
      scope.$watch('saveStatus', function (status, old) {
        elem.removeClass(old).addClass(status);
      });
    }
  };
});
