import { registerController } from 'NgRegistry';
import _ from 'lodash';
import * as SystemFields from 'data/SystemFields';

export default function register() {
  registerController('EntryListColumnsController', [
    '$scope',
    function EntryListColumnsController($scope) {
      const SORTABLE_TYPES = ['Boolean', 'Date', 'Integer', 'Number', 'Symbol', 'Location'];

      $scope.fieldIsSortable = (field) => {
        return _.includes(SORTABLE_TYPES, field.type) && field.id !== 'author';
      };

      $scope.isOrderField = (field) => $scope.context.view.order.fieldId === field.id;

      $scope.orderColumnBy = (field) => {
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
        (displayedFieldIds) => {
          if (
            displayedFieldIds &&
            displayedFieldIds.length &&
            !_.includes(displayedFieldIds, $scope.context.view.order.fieldId)
          ) {
            setOrderField(SystemFields.getFallbackOrderField(displayedFieldIds));
            $scope.updateEntries();
          }
        },
        true
      );

      $scope.orderDescription = (view) => {
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
    },
  ]);
}
