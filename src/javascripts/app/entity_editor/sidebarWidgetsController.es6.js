import { registerController } from 'NgRegistry.es6';

/**
 * Small helper controller to make the `cfWidgetRenderer` directive work.
 *
 * Used in the `entity_sidebar.mixin.jade` template.
 */
registerController('SidebarWidgetRenderController', [
  '$scope',
  '$controller',
  'TheLocaleStore',
  ($scope, $controller, TheLocaleStore) => {
    $scope.locale = TheLocaleStore.getDefaultLocale();
    $scope.fieldLocale = $controller('FieldLocaleController', { $scope });
  }
]);
