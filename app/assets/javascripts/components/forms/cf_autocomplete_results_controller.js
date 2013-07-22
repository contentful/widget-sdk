'use strict';

angular.module('contentful').controller('CfAutocompleteResultsCtrl', function ($scope) {
  var controller = this;
  this.getAutocompleteResults = angular.noop;
  this.setAutocompleteTerm = angular.noop;
  this.selectedIndex = -1;
  this.numResults = 0;

  var unwatchResults = $scope.$watch(function (scope) {
    return controller.getAutocompleteResults(scope);
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
    var results = this.getAutocompleteResults($scope);
    return results[this.selectedIndex];
  };

  this.selectNext = function () {
    if (this.selectedIndex >= this.numResults -1) return;
    this.selectedIndex++;
    $scope.$broadcast('autocompleteResultSelected', this.selectedIndex, this.getSelectedResult());
  };

  this.selectPrevious = function () {
    if (this.selectedIndex <= 0) return;
    this.selectedIndex--;
    $scope.$broadcast('autocompleteResultSelected', this.selectedIndex, this.getSelectedResult());
  };

  this.pickSelected = function () {
    var event = $scope.$emit('autocompleteResultPicked', this.selectedIndex, this.getSelectedResult());
    if (!event.defaultPrevented) this.cancelAutocomplete();
  };

  this.cancelAutocomplete = function () {
    this.setAutocompleteTerm($scope, '');
  };

  $scope.$on('$destroy', function () {
    unwatchResults();
    unwatchResults = null;
  });
});
