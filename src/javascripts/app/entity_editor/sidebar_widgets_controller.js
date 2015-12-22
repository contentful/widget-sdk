'use strict';

angular.module('contentful')
/**
 * Small helper controller to make the `cfWidgetRenderer` directive work.
 *
 * Used in the `entity_sidebar.mixin.jade` template.
 */
.controller('SidebarWidgetRenderController', ['$scope', '$injector', function ($scope, $injector) {
  var TheLocaleStore = $injector.get('TheLocaleStore');

  $scope.field = $scope.widget.field;
  $scope.locale = TheLocaleStore.getDefaultLocale();
}]);
