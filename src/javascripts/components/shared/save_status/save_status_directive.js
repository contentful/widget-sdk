'use strict';

angular.module('contentful').directive('saveStatus', function () {
  return {
    restrict: 'C',
    template: JST['save_status'](),
    controller: 'SaveStatusController',
    link: function (scope, elem) {
      scope.$watch('saveStatus', function (status, old) {
        elem.removeClass(old).addClass(status);
      });
    }
  };
});
