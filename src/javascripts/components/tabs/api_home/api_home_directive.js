'use strict';

angular.module('contentful').directive('cfApiHome', ['notes', function(notes) {
  return {
    template: JST['api_home'](),
    restrict: 'A',
    link: function (scope) {
      scope.notes = notes;
    }
  };
}]);
