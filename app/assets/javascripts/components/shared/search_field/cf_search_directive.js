'use strict';

angular.module('contentful').directive('cfSearch', function(keycodes, debounce){
  return {
    template: JST['cf_search'](),
    scope: {
      placeholder: '@',
      search: '=cfSearch',
      searchAll: '=?',
      tooltip: '@'
    },

    link: function(scope, element, attr) {
      var typeAhead = 'searchTypeAhead' in attr;

      function update() {
        scope.$apply(function (scope) {
          scope.update();
        });
      }

      var debouncedUpdate = debounce(update, 300);

      element.on('keydown', function(ev) {
        if (typeAhead && scope.inner.term) return debouncedUpdate();
        var pressedReturn = ev.keyCode === keycodes.ENTER;
        if (pressedReturn) {
          ev.preventDefault();
          ev.stopPropagation();
          update();
        } else scope.resetSearchAll();
      });
    },

    controller: function cfSearchController($scope) {
      $scope.inner = {
        term: ''
      };

      $scope.searchFieldFocused = function () {
        $scope.$emit('searchFieldFocused');
      };

      $scope.updateFromButton = function () {
        if(!$scope.inner.term) $scope.inner.term = '';
        $scope.update();
      };

      $scope.update = function() {
        $scope.search = $scope.inner.term;
        if($scope.search === '') $scope.searchAll = true;
        else $scope.resetSearchAll();
      };

      $scope.resetSearchAll = function () {
        $scope.searchAll = false;
      };

      $scope.$watch('search', function(search) {
        $scope.inner.term = search;
      });
    }
  };
});


