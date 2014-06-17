'use strict';

angular.module('contentful').directive('gettyImageResults', function(){
  // vertical value at which the fixedResults flag is set to true
  var fixedResultsYTrigger = 140;

  return {
    template: JST.getty_image_results(),
    restrict: 'C',
    link: function (scope, elem) {
      var container = elem.parents('.endless-container');
      scope.fixedResults = false;
      container.on('scroll', function () {
        scope.$apply(function () {
          scope.fixedResults = container.scrollTop() > fixedResultsYTrigger;
        });
      });
    }
  };
});
