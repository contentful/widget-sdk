'use strict';

angular.module('contentful').
  directive('developersHome', function() {
    return {
      template: JST['developers_home'](),
      restrict: 'C'
    };
  });
