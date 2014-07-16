'use strict';

angular.module('contentful').directive('developersHome', ['notes', function(notes) {
  return {
    template: JST['developers_home'](),
    restrict: 'C',
    link: function (scope) {
      scope.notes = notes;
    }
  };
}]);
