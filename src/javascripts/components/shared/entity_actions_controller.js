'use strict';

angular.module('contentful').controller('EntityActionsController',
  ['$scope', '$injector', 'entityType', function EntityActionsController($scope, $injector, entityType) {

  var controller = this;

  var stringUtils = $injector.get('stringUtils');

  $scope.$watch(entityType, addPermissionMethods);

  function addPermissionMethods(){
    var entity = $scope[entityType];
    if(!entity) return;

    controller.canDuplicate = function () {
      return !!(entityType &&
                $scope.permissionController.can('create', stringUtils.capitalizeFirst(entityType)).can
               );
    };

    controller.canDelete = function () {
      return !!(entity.canDelete() && $scope.permissionController.can('delete', entity.data).can);
    };

    controller.canArchive = function () {
      return !!(entity.canArchive() && $scope.permissionController.can('archive', entity.data).can);
    };

    controller.canUnarchive = function () {
      return !!(entity.canUnarchive() && $scope.permissionController.can('unarchive', entity.data).can);
    };

    controller.canUpdate = function () {
      return !!($scope.permissionController.can('update', entity.data).can);
    };

    controller.canUnpublish = function () {
      return !!(entity.canUnpublish() && $scope.permissionController.can('unpublish', entity.data).can);
    };

    controller.canPublish = function() {
      return !!(entity.canPublish() && $scope.permissionController.can('publish', entity.data).can);
    };

  }


}]);
