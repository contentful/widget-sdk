'use strict';

angular.module('contentful').controller('ViewCustomizerCtrl', function ViewCustomizerCtrl($scope) {

  function determineFieldVisibility() {
    var filteredContentType = $scope.spaceContext.getPublishedContentType($scope.tab.params.contentTypeId);
    var contentTypeFields = filteredContentType ? filteredContentType.data.fields : [];
    var fields = $scope.systemFields.concat(contentTypeFields);

    $scope.hiddenFields = _.sortBy(_.reject(fields, fieldIsVisible), 'name');

    function fieldIsVisible(field) {
      return _.contains($scope.displayedFields, field);
    }
  }

  $scope.$watch('displayedFields', determineFieldVisibility);

  $scope.resetDisplayFields = function () {
    $scope.displayedFields = _.clone($scope.systemFields);
  };

  $scope.addDisplayField = function (field) {
    $scope.displayedFields.push(field);
  };

  $scope.removeDisplayField = function (field) {
    _.remove($scope.displayedFields, field);
  };

});
