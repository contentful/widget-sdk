'use strict';

angular.module('contentful').directive('gettyResultsBar', function(){
  return {
    template: JST.getty_results_bar(),
    restrict: 'C',
    scope: true,
    transclude: true,
    link: function (scope, elem, attrs) {
      scope.isActive = function () {
        return !!scope.$eval(attrs.activeWhen);
      };
    }
  };
});
