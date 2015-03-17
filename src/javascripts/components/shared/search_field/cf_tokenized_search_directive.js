'use strict';

angular.module('contentful').directive('cfTokenizedSearch', ['$parse', 'searchQueryHelper', '$timeout', function($parse, searchQueryHelper, $timeout){
  return {
    template: JST['cf_tokenized_search'](),
    restrict: 'A',
    scope: true,
    controller: 'cfTokenizedSearchController',
    controllerAs: 'tokenizedSearchController',
    link: function(scope, element) {
      var input = element.find('input');

      // Make position query available on the scope so it can be called from the controller
      scope.getPosition = function () {
        return scope.hasFocus && input.textrange('get').start;
      };

      // Make range selection available on the scope so it can be called from the controller
      scope.selectRange = function (offset, length) {
        return $timeout(function () {
          input.textrange('set', offset, length);
        }, null, false);
      };

      scope.$on('$destroy', function () {
        scope = null; //MEMLEAK FIX
      });
    }
  };
}]);


