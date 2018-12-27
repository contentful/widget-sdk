import { registerController } from 'NgRegistry.es6';
import _ from 'lodash';
import mimetype from '@contentful/mimetype';

/**
 * Provide a list of asset types and an `update` function to set the
 * asset type validation provided by the `ValidationDialogController`.
 */
registerController('ValidationAssetTypesController', [
  '$scope',
  function($scope) {
    const controller = this;

    controller.types = _.map(mimetype.getGroupNames(), (label, name) => ({
      name: name,
      label: label,
      selected: _.includes($scope.validation.settings, name)
    }));

    controller.update = () => {
      $scope.validation.settings = getSelectedGroups();
      $scope.validate();
    };

    function getSelectedGroups() {
      return _(controller.types)
        .filter('selected')
        .map('name')
        .value();
    }
  }
]);
