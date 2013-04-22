'use strict';

angular.module('contentful/directives').directive('tablistButton', function() {
  return {
    template: JST.tablist_button(),
    restrict: 'C'
  };
});
