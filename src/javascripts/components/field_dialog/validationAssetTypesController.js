import { registerController } from 'core/NgRegistry';
import _ from 'lodash';
import mimetype from '@contentful/mimetype';

export default function register() {
  /**
   * Provide a list of asset types and an `update` function to set the
   * asset type validation provided by the `ValidationDialogController`.
   */
  registerController('ValidationAssetTypesController', [
    '$scope',
    function ValidationAssetTypesController($scope) {
      const controller = this;

      controller.types = _.map(mimetype.getGroupNames(), (label, name) => ({
        name: name,
        label: label,
        selected: _.includes($scope.validation.settings, name),
      }));

      controller.updateFromReact = (types) => {
        $scope.validation.settings = getSelectedGroups(types);
        $scope.validate();
        $scope.$applyAsync();
      };

      controller.update = () => {
        $scope.validation.settings = getSelectedGroups(controller.types);
        $scope.validate();
      };

      function getSelectedGroups(types) {
        return _(types).filter('selected').map('name').value();
      }
    },
  ]);
}
