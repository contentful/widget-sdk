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
    $scope.field = $scope.widget.field;
    $scope.locale = TheLocaleStore.getDefaultLocale();
    $scope.fieldLocale = $controller('FieldLocaleController', {
      $scope: $scope,
      // TODO We should remove this dependency from the
      // FieldLocaleController.
      $attrs: {}
    });
  }
]);
