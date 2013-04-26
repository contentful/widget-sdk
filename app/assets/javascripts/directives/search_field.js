'use strict';

// Search field should have the following interface:
// list of categories, with autocomplete request and select function per
// category (async functions)
//
// For now, without categories, just an enter function or idle function

// A version of ngClick that performs stopPropagation() and
// preventDefault() to support nested click targets
angular.module('contentful/directives').directive('searchField', function(){
  return {
    restrict: 'C',
    template: JST['search_field'](),
    scope: {
      placeholder: '@',
      search: '='
    },

    link: function(scope, element, attr) {
      var typeAhead = 'searchTypeAhead' in attr;

      function update() {
        scope.$apply(function (scope) {
          scope.update();
        });
      }

      var debouncedUpdate = _.debounce(update, 300);

      element.on('keydown', function(e) {
        if (typeAhead) debouncedUpdate();
        var pressedReturn = e.keyCode === 13;
        if (!typeAhead && pressedReturn) update();
      });
    },

    controller: function($scope) {
      $scope.inner = {
        term: ''
      };

      $scope.update = function() {
        $scope.search = $scope.inner.term;
      };

      $scope.$watch('search', function(search) {
        $scope.inner.term = search;
      });
    }
  };
});


