'use strict';

angular.module('contentful')
.controller('EntryListColumnsController', ['$scope', 'require', function ($scope, require) {
  var systemFields = require('systemFields');

  var SORTABLE_TYPES = [
    'Boolean',
    'Date',
    'Integer',
    'Number',
    'Symbol',
    'Location'
  ];

  $scope.fieldIsSortable = function (field) {
    return _.includes(SORTABLE_TYPES, field.type) && field.id !== 'author';
  };

  $scope.isOrderField = function (field) {
    return $scope.context.view.order.fieldId === field.id;
  };

  $scope.orderColumnBy = function (field) {
    if (!$scope.isOrderField(field)) {
      setOrderField(field);
    }
    $scope.context.view.order.direction = switchOrderDirection($scope.context.view.order.direction);
    $scope.updateEntries();
  };

  $scope.$watch('context.view.displayedFieldIds', function (displayedFieldIds) {
    if (displayedFieldIds &&
      !_.includes(displayedFieldIds, $scope.context.view.order.fieldId)
    ) {
      setOrderField(systemFields.getFallbackOrderField(displayedFieldIds));
      $scope.updateEntries();
    }
  }, true);

  $scope.orderDescription = function (view) {
    var field = _.find($scope.displayedFields, {id: view.order.fieldId});
    var direction = view.order.direction;
    return '' + direction + ' by ' + field.name;
  };

  $scope.getFieldList = function () {
    return _.map($scope.displayedFields, 'name').join(', ');
  };

  function setOrderField (field) {
    $scope.context.view.order = {fieldId: field.id};
  }

  function switchOrderDirection (direction) {
    return direction === 'ascending' ? 'descending' : 'ascending';
  }
}]);
