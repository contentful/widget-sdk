'use strict';

angular.module('contentful').factory('addCanMethods',
  ['can', function(can){

    function makePermissionAdder(scope, entityType, methodOverrides){
      methodOverrides = methodOverrides || {};
      return function addActionPermissions(){
        var entity = scope[entityType],
            otDoc = scope.otDoc;

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
            if (!otDoc) return false;
            var version = otDoc.version;
            var publishedVersion = otDoc.getAt(['sys', 'publishedVersion']);
            var updatedSincePublishing = version !== publishedVersion + 1;
            return entity.canPublish() && (!publishedVersion || updatedSincePublishing) && can('publish', entity.data);
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
      scope.$watch('otDoc', addActionPermissions);
    };
  }]
);
