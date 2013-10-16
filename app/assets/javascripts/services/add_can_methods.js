'use strict';

angular.module('contentful').factory('addCanMethods',
  ['can', function(can){

    function makePermissionAdder(scope, entityType, methodOverrides){
      methodOverrides = methodOverrides || {};
      return function addActionPermissions(){
        var entity = scope[entityType];

        var permissionMethods = {
          canDuplicate: function () {
            return can(
              'create',
              entityType[0].toUpperCase() + entityType.substr(1, entityType.length)
            );
          },

          canDelete: function () {
            return entity.canDelete() && can('delete', entity.data);
          },

          canArchive: function () {
            return entity.canArchive() && can('archive', entity.data);
          },

          canUnarchive: function () {
            return entity.canUnarchive() && can('unarchive', entity.data);
          },

          canUnpublish: function () {
            return entity.canUnpublish() && can('unpublish', entity.data);
          },

          canPublish: function() {
            return entity.canPublish() && can('publish', entity.data);
          }
        };

        for(var method in permissionMethods){
          if(method in methodOverrides){
            scope[method] = methodOverrides[method];
          } else {
            scope[method] = permissionMethods[method];
          }
        }
      };
    }

    return function (scope, entityType, methodOverrides) {
      var addActionPermissions = makePermissionAdder.apply(null, arguments);
      scope.$watch(entityType, addActionPermissions);
    };
  }]
);
