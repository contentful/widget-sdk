'use strict';

angular.module('contentful').factory('TheAccountView', function($state) {
  var isActive = false;

  return {
    goTo:     goTo,
    check:    check,
    isActive: function() { return isActive; }
  };

  function goTo(pathSuffix, options) {
    $state.go('account.pathSuffix', { pathSuffix: pathSuffix }, options);
  }

  function check() {
    isActive = $state.includes('account');
  }
});
