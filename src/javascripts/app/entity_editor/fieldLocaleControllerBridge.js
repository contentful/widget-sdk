import { registerController } from 'core/NgRegistry';
import { assign } from 'lodash';
import { createFieldLocaleController } from './fieldLocaleController';

// TODO Remove temporary FieldLocaleController as soon as `cf-entity-field` is migrated
export default function register() {
  registerController('FieldLocaleController', [
    '$scope',
    function FieldLocaleController($scope) {
      const fieldLocaleController = createFieldLocaleController($scope);
      $scope.canEditLocale = fieldLocaleController.canEditLocale;
      assign(this, fieldLocaleController);
    },
  ]);
}
