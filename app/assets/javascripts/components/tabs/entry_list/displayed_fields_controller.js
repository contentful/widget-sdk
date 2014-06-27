'use strict';

angular.module('contentful').controller('DisplayedFieldsController', ['$scope', function DisplayedFieldsController($scope) {

  function getAvailableFields(contentTypeId) {
    var filteredContentType = $scope.spaceContext.getPublishedContentType(contentTypeId);
    var contentTypeFields = filteredContentType ? _.reject(filteredContentType.data.fields, {disabled: true}) : [];
    var fields = $scope.systemFields.concat(contentTypeFields);
    if (filteredContentType) _.remove(fields, function (field) { return field.id === filteredContentType.data.displayField; });
    return fields;
  }

  $scope.refreshDisplayFields = function () {
    var displayedFieldIds = $scope.tab.params.view.displayedFieldIds;
    var fields = getAvailableFields($scope.tab.params.view.contentTypeId);

    $scope.displayedFields = _.map(displayedFieldIds, function (id) {
      return _.find(fields, {id: id});
    });
    $scope.hiddenFields    = _.sortBy(_.reject(fields, fieldIsDisplayed), 'name');

    function fieldIsDisplayed(field) {
      return _.contains(displayedFieldIds, field.id);
    }
  };

  $scope.$watch('[tab.params.view.contentTypeId, tab.params.view.displayedFieldIds]', $scope.refreshDisplayFields, true);

  $scope.resetDisplayFields = function () {
    $scope.tab.params.view.displayedFieldIds = $scope.getDefaultFieldIds();
  };

  $scope.addDisplayField = function (field) {
    $scope.tab.params.view.displayedFieldIds.push(field.id);
  };

  $scope.removeDisplayField = function (field) {
    _.remove($scope.tab.params.view.displayedFieldIds, function (id) {
      return id === field.id;
    });
  };

}]);
