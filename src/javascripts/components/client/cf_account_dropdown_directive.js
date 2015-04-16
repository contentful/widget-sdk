'use strict';

angular.module('contentful').directive('cfAccountDropdown', function() {
  return {
    template: JST.cf_account_dropdown(),
    restrict: 'E',
    replace: true
  };
});
