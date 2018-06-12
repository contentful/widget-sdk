'use strict';

angular.module('contentful')
.controller('DisplayedFieldsController', ['$scope', 'require', ($scope, require) => {
  var systemFields = require('systemFields');
  var spaceContext = require('spaceContext');

  function getAvailableFields (contentTypeId) {
    var filteredContentType = spaceContext.publishedCTs.get(contentTypeId);
    var contentTypeFields = filteredContentType ? _.reject(filteredContentType.data.fields, {disabled: true}) : [];
    var fields = systemFields.getList().concat(contentTypeFields);

    if (filteredContentType) {
      _.remove(fields, field => field.id === filteredContentType.data.displayField);
    }
    return fields;
  }

  $scope.hiddenFields = [];

  $scope.refreshDisplayFields = () => {
    var displayedFieldIds = $scope.context.view.displayedFieldIds;
    var fields = getAvailableFields($scope.context.view.contentTypeId);
    var unavailableFieldIds = [];

    $scope.displayedFields = _.filter(_.map(displayedFieldIds, id => {
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
    $scope.context.view.displayedFieldIds = _.reject($scope.context.view.displayedFieldIds, id => _.includes(unavailableFieldIds, id));
  }

  $scope.$watch(
    '[context.view.contentTypeId, context.view.displayedFieldIds]',
    newValues => {
      // `view` can be `undefined`.
      if (newValues[0] || newValues[1]) {
        $scope.refreshDisplayFields();
      }
    }, true);

  $scope.resetDisplayFields = () => {
    $scope.context.view.displayedFieldIds = systemFields.getDefaultFieldIds();
  };

  $scope.addDisplayField = field => {
    $scope.context.view.displayedFieldIds.push(field.id);
  };

  $scope.removeDisplayField = field => {
    _.remove($scope.context.view.displayedFieldIds, id => id === field.id);
  };
}]);
