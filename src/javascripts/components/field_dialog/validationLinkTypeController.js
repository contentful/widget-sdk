import { registerController } from 'NgRegistry';
import _ from 'lodash';
import * as K from 'utils/kefir';

export default function register() {
  /**
   * Render a list of published content types with checkboxes that toggle
   * whether the content type is acceptable for this link field.
   */
  registerController('ValidationLinkTypeController', [
    '$scope',
    'spaceContext',
    function ValidationLinkTypeController($scope, spaceContext) {
      K.onValueScope($scope, spaceContext.publishedCTs.items$, cts => {
        $scope.contentTypes = cts.map(decorateContentType);
      });

      $scope.update = contentTypes => {
        $scope.contentTypes = contentTypes;
        $scope.validation.settings = getSelectedIDs(contentTypes);
        $scope.validator.run();
        $scope.$applyAsync();
      };

      function decorateContentType(ct) {
        const id = ct.sys.id;
        return {
          id: id,
          selected: isSelected(id),
          name: ct.name || 'Untitled'
        };
      }

      function getSelectedIDs(contentTypes) {
        return _(contentTypes)
          .filter('selected')
          .map('id')
          .value();
      }

      function isSelected(contentTypeId) {
        return _.includes($scope.validation.settings, contentTypeId);
      }
    }
  ]);
}
