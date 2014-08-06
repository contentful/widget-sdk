'use strict';

angular.module('contentful').directive('apiHome', ['notes', function(notes) {
  return {
    template: JST['api_home'](),
    restrict: 'C',
    link: function (scope) {
      scope.notes = notes;
    }
  };
}]);
