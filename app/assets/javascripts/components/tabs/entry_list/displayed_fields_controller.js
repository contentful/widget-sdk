'use strict';

angular.module('contentful').controller('DisplayedFieldsController', function DisplayedFieldsController($scope) {

  function getAvailableFields(contentTypeId) {
    var filteredContentType = $scope.spaceContext.getPublishedContentType(contentTypeId);
    var contentTypeFields = filteredContentType ? filteredContentType.data.fields : [];
    var fields = $scope.systemFields.concat(contentTypeFields);
    if (filteredContentType) _.remove(fields, function (field) { return field.id === filteredContentType.data.displayField; });
    return fields;
  }

  $scope.refreshDisplayFields = function () {
    var displayedFieldIds = $scope.tab.params.preset.displayedFieldIds;
    var fields = getAvailableFields($scope.tab.params.preset.contentTypeId);

    $scope.displayedFields = _.map(displayedFieldIds, function (id) {
      return _.find(fields, {id: id});
    });
    $scope.hiddenFields    = _.sortBy(_.reject(fields, fieldIsDisplayed), 'name');

    function fieldIsDisplayed(field) {
      return _.contains(displayedFieldIds, field.id);
    }
  };

  $scope.$watch('[tab.params.preset.contentTypeId, tab.params.preset.displayedFieldIds]', $scope.refreshDisplayFields, true);

  $scope.resetDisplayFields = function () {
    $scope.tab.params.preset.displayedFieldIds = _.map($scope.systemFields, 'id');
  };

  $scope.addDisplayField = function (field) {
    $scope.tab.params.preset.displayedFieldIds.push(field.id);
  };

  $scope.removeDisplayField = function (field) {
    _.remove($scope.tab.params.preset.displayedFieldIds, function (id) {
      return id === field.id;
    });
  };

});
