'use strict';

angular
  .module('contentful')
  /**
   * Small helper controller to make the `cfWidgetRenderer` directive work.
   *
   * Used in the `entity_sidebar.mixin.jade` template.
   */
  .controller('SidebarWidgetRenderController', [
    '$scope',
    'require',
    ($scope, require) => {
      const TheLocaleStore = require('TheLocaleStore');
      const $controller = require('$controller');

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
