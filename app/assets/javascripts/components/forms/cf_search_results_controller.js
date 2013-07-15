'use strict';

angular.module('contentful').controller('CfSearchResultsCtrl', function ($scope) {
  var controller = this;
  this.getSearchResults = angular.noop;
  this.setSearchTerm = angular.noop;
  this.selectedIndex = -1;
  this.numResults = 0;

  var unwatchResults = $scope.$watch(function (scope) {
    return controller.getSearchResults(scope);
  }, function (results) {
    if (_.isEmpty(results)) {
      controller.selectedIndex = -1;
      controller.numResults = 0;
    } else {
      controller.selectedIndex = 0;
      controller.numResults = results.length;
    }
  });

  this.getSelectedResult = function () {
    var results = this.getSearchResults($scope);
    return results[this.selectedIndex];
  };

  this.selectNext = function () {
    if (this.selectedIndex >= this.numResults -1) return;
    this.selectedIndex++;
    $scope.$broadcast('searchResultSelected', this.selectedIndex, this.getSelectedResult());
  };

  this.selectPrevious = function () {
    if (this.selectedIndex <= 0) return;
    this.selectedIndex--;
    $scope.$broadcast('searchResultSelected', this.selectedIndex, this.getSelectedResult());
  };

  this.pickSelected = function () {
    var event = $scope.$emit('searchResultPicked', this.selectedIndex, this.getSelectedResult());
    if (!event.defaultPrevented) this.cancelSearch();
  };

  this.cancelSearch = function () {
    this.setSearchTerm($scope, '');
  };

  $scope.$on('$destroy', function () {
    unwatchResults();
    unwatchResults = null;
  });
});
