'use strict';

angular.module('contentful').controller('ViewCustomizerCtrl', function ViewCustomizerCtrl($scope) {
  var displayedFieldIds;

  function determineFieldVisibility() {
    var filteredContentType = $scope.spaceContext.getPublishedContentType($scope.tab.params.contentTypeId);
    var contentTypeFields = filteredContentType ? filteredContentType.data.fields : [];
    var displayedFields = $scope.systemFields.concat(contentTypeFields);

    $scope.displayedFields = _.filter(displayedFields, fieldIsSelected);
    $scope.hiddenFields = _.sortBy(_.reject(displayedFields, fieldIsSelected), 'name');

    function fieldIsSelected(field) {
      return _.contains(displayedFieldIds, field.id);
    }
  }

  $scope.resetDisplayFields = function () {
    displayedFieldIds = ['author', 'updatedAt'];
    determineFieldVisibility();
  };

  $scope.addDisplayField = function (fieldId) {
    displayedFieldIds.push(fieldId);
    determineFieldVisibility();
  };

  $scope.removeDisplayField = function (fieldId) {
    _.remove(displayedFieldIds, fieldId);
    determineFieldVisibility();
  };

});
