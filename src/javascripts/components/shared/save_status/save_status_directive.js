'use strict';

angular.module('contentful').directive('cfSaveStatus', function () {
  return {
    restrict: 'A',
    template: JST['save_status'](),
    controller: 'SaveStatusController',
    link: function (scope, elem) {
      scope.$watch('saveStatus', function (status, old) {
        elem.removeClass(old).addClass(status);
      });
    }
  };
});
