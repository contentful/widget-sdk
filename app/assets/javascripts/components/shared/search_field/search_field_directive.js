'use strict';

angular.module('contentful').directive('searchField', function(keycodes){
  return {
    restrict: 'C',
    template: JST['search_field'](),
    scope: {
      placeholder: '@',
      search: '=',
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

      var debouncedUpdate = _.debounce(update, 300);

      element.on('keydown', function(ev) {
        if (typeAhead && scope.inner.term) return debouncedUpdate();
        var pressedReturn = ev.keyCode === keycodes.ENTER;
        if (pressedReturn) {
          ev.preventDefault();
          ev.stopPropagation();
          update();
        } else scope.resetSearchAll();
      });

      scope.$watch('inner.term', function (inner, old) {
        if (inner === old) return;
        var position = element.find('input').textrange('get').end;
        scope.$emit('searchChanged', inner, position);
      });
    },

    controller: function SearchFieldCtrl($scope) {
      $scope.inner = {
        term: ''
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


