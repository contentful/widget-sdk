'use strict';

angular.module('contentful').controller('ViewCustomizerCtrl', function ViewCustomizerCtrl($scope) {

  function refreshHiddenFields() {
    var filteredContentType = $scope.spaceContext.getPublishedContentType($scope.tab.params.contentTypeId);
    var contentTypeFields = filteredContentType ? filteredContentType.data.fields : [];
    var fields = $scope.systemFields.concat(contentTypeFields);

    $scope.hiddenFields = _.sortBy(_.filter(fields, fieldIsHidden), 'name');

    function fieldIsHidden(field) {
      return filteredContentType &&
        !_.contains($scope.displayedFields, field) &&
        field.id !== filteredContentType.data.displayField;
    }
  }

  $scope.$watch('tab.params.contentTypeId', refreshHiddenFields);
  $scope.$watch('displayedFields', refreshHiddenFields, true);

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
