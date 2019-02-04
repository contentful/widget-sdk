import { registerController } from 'NgRegistry.es6';
import _ from 'lodash';
import * as K from 'utils/kefir.es6';

export default function register() {
  /**
   * Render a list of published content types with checkboxes that toggle
   * whether the content type is acceptable for this link field.
   */
  registerController('ValidationLinkTypeController', [
    '$scope',
    'spaceContext',
    ($scope, spaceContext) => {
      K.onValueScope($scope, spaceContext.publishedCTs.items$, cts => {
        $scope.contentTypes = cts.map(decorateContentType);
      });

      $scope.update = () => {
        $scope.validation.settings = getSelectedIDs();
        $scope.validator.run();
      };

      function decorateContentType(ct) {
        const id = ct.sys.id;
        return {
          id: id,
          selected: isSelected(id),
          name: ct.name || 'Untitled'
        };
      }

      function getSelectedIDs() {
        return _($scope.contentTypes)
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
