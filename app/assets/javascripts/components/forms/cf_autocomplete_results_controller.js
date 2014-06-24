'use strict';

angular.module('contentful').controller('CfAutocompleteResultsCtrl', function ($scope, $attrs, $parse) {
  var controller = this;
  var getAutocompleteResults = $parse($attrs.cfAutocompleteResults);
  this.selectedIndex = -1;
  this.numResults = 0;

  var unwatchResults = $scope.$watch(
    getAutocompleteResults,
  function (results) {
    if (_.isEmpty(results)) {
      controller.selectedIndex = -1;
      controller.numResults = 0;
    } else {
      controller.selectedIndex = 0;
      controller.numResults = results.length;
    }
  });

  this.getSelectedResult = function () {
    var results = getAutocompleteResults($scope);
    return results[this.selectedIndex];
  };

  this.selectNext = function () {
    if (this.numResults === 0) return false;
    if (this.selectedIndex < this.numResults -1) {
      this.selectedIndex++;
      $scope.$broadcast('autocompleteResultSelected', this.selectedIndex, this.getSelectedResult());
    }
    return true;
  };

  this.selectPrevious = function () {
    if (this.numResults === 0) return false;
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      $scope.$broadcast('autocompleteResultSelected', this.selectedIndex, this.getSelectedResult());
    }
    return true;
  };

  this.pickSelected = function () {
    if (this.selectedIndex < 0) return false;
    $scope.$emit('autocompleteResultPicked', this.selectedIndex, this.getSelectedResult());
    return true;
  };

  this.cancelAutocomplete = function () {
    $scope.$emit('autocompleteResultsCancel');
    return true;
  };

  $scope.$on('$destroy', function () {
    unwatchResults();
    unwatchResults = null;
  });
});
