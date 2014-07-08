'use strict';

angular.module('contentful').directive('developersSidebar', function() {
  return {
    template: JST['developers_sidebar'](),
    restrict: 'C'
  };
});
