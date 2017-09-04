'use strict';

angular.module('contentful')
.directive('cfViewFolder', ['require', function (require) {
  var spaceContext = require('spaceContext');
  var openRoleSelector = require('app/RoleSelector').default;
  var Tracking = require('analytics/events/SearchAndViews');

  return {
    restrict: 'A',
    template: JST['cf_view_folder'](),
    controller: ['$scope', function ($scope) {
      $scope.$watch('folder.id', function (id) {
        $scope.regularFolder = id !== 'default';
      });

      $scope.isVisible = isVisible;
      $scope.canAssignViewRoles = canAssignViewRoles;
      $scope.editViewRoles = editViewRoles;

      $scope.$watch(function () {
        // Returns true when there are no views in the folder
        return $scope.folder.views.every(function (view) {
          return !isVisible(view);
        });
      }, function (allHidden) {
        $scope.folderVisible = !allHidden || $scope.canEdit;
      });

      /**
       * If the view has a `roles` property we only return true if the
       * user has one of the roles given.
       *
       * We always return true if the user is an admin or if the view
       * does not have the `roles` property.
       */
      function isVisible (view) {
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
      }

      /**
       * Only views for Entries can be assigned role(s)
       *
       * TODO We don’t check permissions here. They are implicit in the
       * visibility of the button.
       */
      function canAssignViewRoles () {
        return !$scope.assetContentType;
      }

      /**
       * Opens a dialog when saved view's visibility setting is clicked.
       * Updates the view locally and propagates the change to the backend.
       */
      function editViewRoles (view) {
        openRoleSelector(spaceContext.endpoint, view.roles)
          .then(function (roles) {
            view.roles = roles;
            $scope.saveViews();
            Tracking.viewRolesEdited(view);
          });
      }
    }]
  };
}]);
