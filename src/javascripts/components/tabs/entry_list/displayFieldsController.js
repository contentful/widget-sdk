import { registerController } from 'NgRegistry';
import { isBoolean, reject, pull, remove, filter, map, find, uniq, sortBy, includes } from 'lodash';
import * as SystemFields from 'data/SystemFields';

export default function register() {
  registerController('DisplayedFieldsController', [
    '$scope',
    'spaceContext',
    ($scope, spaceContext) => {
      function getAvailableFields(contentTypeId) {
        const filteredContentType = spaceContext.publishedCTs.get(contentTypeId);
        const contentTypeFields = filteredContentType
          ? reject(filteredContentType.data.fields, { disabled: true })
          : [];
        const fields = SystemFields.getList().concat(contentTypeFields);

        if (filteredContentType) {
          remove(fields, { id: filteredContentType.data.displayField });
        }
        return fields;
      }

      $scope.hiddenFields = [];

      $scope.refreshDisplayFields = () => {
        const displayedFieldIds = uniq($scope.context.view.displayedFieldIds);
        const fields = getAvailableFields($scope.context.view.contentTypeId);
        const unavailableFieldIds = [];

        $scope.displayedFields = filter(
          map(displayedFieldIds, id => {
            const field = find(fields, { id });
            if (!field) unavailableFieldIds.push(id);
            return field;
          })
        );

        $scope.hiddenFields = sortBy(reject(fields, fieldIsDisplayed), 'name');

        cleanDisplayedFieldIds(unavailableFieldIds);

        function fieldIsDisplayed(field) {
          return includes(displayedFieldIds, field.id);
        }
      };

      function cleanDisplayedFieldIds(unavailableFieldIds) {
        $scope.context.view.displayedFieldIds = reject($scope.context.view.displayedFieldIds, id =>
          includes(unavailableFieldIds, id)
        );
      }

      $scope.$watch(
        '[context.view.contentTypeId, context.view.contentTypeHidden, context.view.displayedFieldIds]',
        ([contentTypeId, contentTypeHidden, displayedFieldIds]) => {
          // `view` can be `undefined`.
          if (contentTypeId || isBoolean(contentTypeHidden) || displayedFieldIds) {
            $scope.refreshDisplayFields();
          }
        },
        true
      );

      $scope.resetDisplayFields = () => {
        $scope.context.view.displayedFieldIds = SystemFields.getDefaultFieldIds();
      };

      $scope.addDisplayField = field => {
        $scope.context.view.displayedFieldIds.push(field.id);
        $scope.$applyAsync();
      };

      $scope.removeDisplayField = field => {
        pull($scope.context.view.displayedFieldIds, field.id);
        $scope.$applyAsync();
      };

      $scope.toggleContentType = () => {
        $scope.context.view.contentTypeHidden = !$scope.context.view.contentTypeHidden;
        $scope.$applyAsync();
      };

      $scope.updateFieldOrder = fields => {
        $scope.displayedFields = fields;
        $scope.context.view.displayedFieldIds = map($scope.displayedFields, 'id');
        $scope.$applyAsync();
      };
    }
  ]);
}
