'use strict';

angular.module('contentful').controller('EntryListColumnsController', [
  '$scope',
  'require',
  ($scope, require) => {
    const _ = require('lodash');
    const systemFields = require('systemFields');

    const SORTABLE_TYPES = ['Boolean', 'Date', 'Integer', 'Number', 'Symbol', 'Location'];

    $scope.fieldIsSortable = field =>
      _.includes(SORTABLE_TYPES, field.type) && field.id !== 'author';

    $scope.isOrderField = field => $scope.context.view.order.fieldId === field.id;

    $scope.orderColumnBy = field => {
      if (!$scope.isOrderField(field)) {
        setOrderField(field);
      }
      $scope.context.view.order.direction = switchOrderDirection(
        $scope.context.view.order.direction
      );
      $scope.updateEntries();
    };

    $scope.$watch(
      'context.view.displayedFieldIds',
      displayedFieldIds => {
        if (
          displayedFieldIds &&
          !_.includes(displayedFieldIds, $scope.context.view.order.fieldId)
        ) {
          setOrderField(systemFields.getFallbackOrderField(displayedFieldIds));
          $scope.updateEntries();
        }
      },
      true
    );

    $scope.orderDescription = view => {
      const field = _.find($scope.displayedFields, { id: view.order.fieldId });
      const direction = view.order.direction;
      return '' + direction + ' by ' + field.name;
    };

    $scope.getFieldList = () => _.map($scope.displayedFields, 'name').join(', ');

    function setOrderField(field) {
      $scope.context.view.order = { fieldId: field.id };
    }

    function switchOrderDirection(direction) {
      return direction === 'ascending' ? 'descending' : 'ascending';
    }
  }
]);
