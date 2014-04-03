'use strict';
angular.module('contentful').directive('offerAutocompletions', function(searchQueryHelper){
  return {
    link: function(scope){
      scope.$on('searchChanged', function (event, term, position) {
        var contentType;
        scope.autocompletions = searchQueryHelper.offerCompletion(contentType, term, position);
      });
    }
  };
});
