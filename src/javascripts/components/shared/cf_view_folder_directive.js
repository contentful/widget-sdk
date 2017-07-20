'use strict';

angular.module('contentful')
.directive('cfViewFolder', ['require', function (require) {
  var spaceContext = require('spaceContext');
  var openRoleSelector = require('app/RoleSelector').default;

  return {
    restrict: 'A',
    template: JST['cf_view_folder'](),
    controller: ['$scope', function ($scope) {
      $scope.$watch('folder.id', function (id) {
        $scope.regularFolder = id !== 'default';
      });

      /**
       * If the view has a `roles` property we only return true if the
       * user has one of the roles given.
       *
       * We always return true if the user is an admin or if the view
       * does not have the `roles` property.
       */
      $scope.isVisible = function (view) {
        var spaceMembership = spaceContext.space.data.spaceMembership;

        if (spaceMembership.admin) {
          return true;
        } else {
          if (view.roles) {
            return view.roles.some(function (viewRoleId) {
              return spaceMembership.roles.some(function (userRole) {
                return viewRoleId === userRole.sys.id;
              });
            });
          } else {
            return true;
          }
        }
      };

      /**
       * Only views for Entries can be assigned role(s)
       */
      $scope.canAssignViewRoles = function () {
        return !$scope.assetContentType;
      };

      $scope.editViewRoles = function (view) {
        openRoleSelector(spaceContext.endpoint, view.roles)
          .then(function (roles) {
            view.roles = roles;
            $scope.saveViews();
          });
      };
    }]
  };
}]);
