'use strict';

angular.module('contentful').controller('EntityActionsController',
  ['$scope', '$injector', 'params', function EntityActionsController($scope, $injector, params) {

  var stringUtils = $injector.get('stringUtils');
  var entityType = params.entityType;
  var methodOverrides = params.methodOverrides || {};

  $scope.$watch(entityType, addPermissionMethods);

  function addPermissionMethods(){
    var entity = $scope[entityType];
    if(!entity) return;

    var permissionMethods = {
      canDuplicate: function () {
        return !!(entityType &&
                  $scope.permissionController.can('create', stringUtils.capitalizeFirst(entityType)).can
                 );
      },

      canDelete: function () {
        return !!(entity.canDelete() && $scope.permissionController.can('delete', entity.data).can);
      },

      canArchive: function () {
        return !!(entity.canArchive() && $scope.permissionController.can('archive', entity.data).can);
      },

      canUnarchive: function () {
        return !!(entity.canUnarchive() && $scope.permissionController.can('unarchive', entity.data).can);
      },

      canUnpublish: function () {
        return !!(entity.canUnpublish() && $scope.permissionController.can('unpublish', entity.data).can);
      },

      canPublish: function() {
        return !!(entity.canPublish() && $scope.permissionController.can('publish', entity.data).can);
      }
    };

    for(var method in permissionMethods){
      $scope[method] = (method in methodOverrides) ? methodOverrides[method] : $scope[method] = permissionMethods[method];
    }
  }


}]);
