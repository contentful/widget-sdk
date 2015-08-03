'use strict';

angular.module('contentful')
.controller('EntityActionsController',
['$scope', '$injector', 'entityType', function EntityActionsController($scope, $injector, entityType) {

  var controller = this;

  var capitalizeFirst = $injector.get('stringUtils').capitalizeFirst;
  var entity;

  $scope.$watch(entityType, function (newEntity) {
    entity = newEntity;
  });

  controller.canDelete = bindCan('delete');
  controller.canPublish = bindCan('publish');
  controller.canUnpublish = bindCan('unpublish');
  controller.canArchive = bindCan('archive');
  controller.canUnarchive = bindCan('unarchive');

  controller.canUpdate = function () {
    return hasPermission('update');
  };

  controller.canDuplicate = function () {
    return hasPermission('create', capitalizeFirst(entityType));
  };


  function hasPermission (action, data) {
    data = data || entity.data;
    return $scope.permissionController.can(action, data).can;
  }

  function entityAllowsAction (action) {
    var methodName = 'can' + capitalizeFirst(action);
    return entity && entity[methodName]();
  }

  function can (action) {
    return entityAllowsAction(action) && hasPermission(action);
  }

  function bindCan (action) {
    return function () {
      return can(action);
    };
  }
}]);
