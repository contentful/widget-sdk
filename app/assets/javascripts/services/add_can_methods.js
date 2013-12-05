'use strict';

angular.module('contentful').factory('addCanMethods', [function(){
    function makePermissionAdder(scope, entityType, methodOverrides){
      methodOverrides = methodOverrides || {};
      return function addActionPermissions(){
        var entity = scope[entityType];

        var permissionMethods = {
          canDuplicate: function () {
            return !!(entityType && scope.can('create',
              entityType[0].toUpperCase() + entityType.substr(1, entityType.length)
            ));
          },

          canDelete: function () {
            return !!(entity.canDelete() && scope.can('delete', entity.data));
          },

          canArchive: function () {
            return !!(entity.canArchive() && scope.can('archive', entity.data));
          },

          canUnarchive: function () {
            return !!(entity.canUnarchive() && scope.can('unarchive', entity.data));
          },

          canUnpublish: function () {
            return !!(entity.canUnpublish() && scope.can('unpublish', entity.data));
          },

          canPublish: function() {
            return !!(entity.canPublish() && scope.can('publish', entity.data));
          }
        };

        for(var method in permissionMethods){
          scope[method] = (method in methodOverrides) ? methodOverrides[method] : scope[method] = permissionMethods[method];
        }
      };
    }

    return function (scope, entityType/*, methodOverrides*/) {
      var addActionPermissions = makePermissionAdder.apply(null, arguments);
      scope.$watch(entityType, addActionPermissions);
    };
  }]
);
