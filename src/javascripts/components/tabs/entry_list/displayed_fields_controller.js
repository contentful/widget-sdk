'use strict';

angular.module('contentful')
.controller('DisplayedFieldsController', ['$scope', 'require', function ($scope, require) {
  var systemFields = require('systemFields');
  var spaceContext = require('spaceContext');

  function getAvailableFields (contentTypeId) {
    var filteredContentType = spaceContext.publishedCTs.get(contentTypeId);
    var contentTypeFields = filteredContentType ? _.reject(filteredContentType.data.fields, {disabled: true}) : [];
    var fields = systemFields.getList().concat(contentTypeFields);

    if (filteredContentType) {
      _.remove(fields, function (field) { return field.id === filteredContentType.data.displayField; });
    }
    return fields;
  }

  $scope.hiddenFields = [];

  $scope.refreshDisplayFields = function () {
    var displayedFieldIds = $scope.context.view.displayedFieldIds;
    var fields = getAvailableFields($scope.context.view.contentTypeId);
    var unavailableFieldIds = [];

    $scope.displayedFields = _.filter(_.map(displayedFieldIds, function (id) {
      var field = _.find(fields, {id: id});
      if (!field) unavailableFieldIds.push(id);
      return field;
    }));

    $scope.hiddenFields = _.sortBy(_.reject(fields, fieldIsDisplayed), 'name');

    cleanDisplayedFieldIds(unavailableFieldIds);

    function fieldIsDisplayed (field) {
      return _.includes(displayedFieldIds, field.id);
    }
  };

  function cleanDisplayedFieldIds (unavailableFieldIds) {
    $scope.context.view.displayedFieldIds = _.reject($scope.context.view.displayedFieldIds, function (id) {
      return _.includes(unavailableFieldIds, id);
    });
  }

  $scope.$watch(
    '[context.view.contentTypeId, context.view.displayedFieldIds]',
    function (newValues) {
      // `view` can be `undefined`.
      if (newValues[0] || newValues[1]) {
        $scope.refreshDisplayFields();
      }
    }, true);

  $scope.resetDisplayFields = function () {
    $scope.context.view.displayedFieldIds = systemFields.getDefaultFieldIds();
  };

  $scope.addDisplayField = function (field) {
    $scope.context.view.displayedFieldIds.push(field.id);
  };

  $scope.removeDisplayField = function (field) {
    _.remove($scope.context.view.displayedFieldIds, function (id) {
      return id === field.id;
    });
  };
}]);
