'use strict';

angular.module('contentful').directive('cfTokenizedSearch', ['$parse', 'searchQueryHelper', '$timeout', function($parse, searchQueryHelper, $timeout){
  return {
    template: JST['cf_tokenized_search'](),
    scope: true,
    controller: 'cfTokenizedSearchController',
    controllerAs: 'tokenizedSearchController',
    link: function(scope, element) {
      var input = element.find('input');

      scope.getPosition = function () {
        return scope.hasFocus && input.textrange('get').start;
      };

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


