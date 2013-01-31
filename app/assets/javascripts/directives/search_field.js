// Search field should have the following interface:
// list of categories, with autocomplete request and select function per
// category (async functions)
//
// For now, without categories, just an enter function or idle function
//
// What about the search options?
//
// TODO: Options to go without search-options dropdown

// A version of ngClick that performs stopPropagation() and
// preventDefault() to support nested click targets
angular.module('contentful/directives').directive('searchField', function(){
'use strict';
  return {
    restrict: 'C',
    scope: {
      onIdleUpdate: '=' // This value will be updated with the entered searchterm whenever the user stops typing
    },
    template: JST['search_field'](),
    link: function(scope) {
      scope.search = {term: ''};

      scope.$watch('onIdleUpdate', function(newTerm, old, scope) {
        scope.search.term = newTerm;
      });

      scope.hasFilters = function() {
        return false;
      };

      scope.userChange= _.debounce(function() {
        if (scope.onIdleUpdate !== scope.search.term) {
          scope.$apply(function(scope) {
            scope.onIdleUpdate = scope.search.term;
          });
        }
      }, 700);
    }
  };
});


