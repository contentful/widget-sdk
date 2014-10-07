angular.module('contentful').controller('CreateSpaceDialogCtrl', [
  '$scope', 'client', 'notification', 'cfSpinner', 'enforcements', '$rootScope',
  function CreateSpaceDialogCtrl($scope, client, notification, cfSpinner, enforcements, $rootScope) {
    'use strict';

    function resetNewSpaceData() {
      $scope.newSpaceData = _.cloneDeep({defaultLocale: 'en-US'});
      $scope.lockSubmit = false;
    }

    $scope.writableOrganizations = _.filter($scope.organizations, function (org) {
      return org && org.sys ? $scope.canCreateSpaceInOrg(org.sys.id) : false;
    });

    resetNewSpaceData();

    $scope.dialog.setInvalid(true);
    $scope.$watch('newSpaceForm.$invalid', function (state) {
      $scope.dialog.setInvalid(state);
    });

    $scope.selectOrganization = function (org) {
      $scope.selectedOrganization = org;
    };

    if($scope.writableOrganizations.length > 0){
      $scope.selectOrganization($scope.writableOrganizations[0]);
    }

    function hasErrorOnField(err, error, field) {
      var errors = dotty.get(err, 'body.details.errors');
      if(errors && errors.length > 0){
        return errors[0].path == field &&
               errors[0].name == error;
      }
      return false;
    }

    $scope.createSpace = function () {
      if ($scope.lockSubmit) return;
      $scope.lockSubmit = true;
      var stopSpinner = cfSpinner.start();
      var data = {name: $scope.newSpaceData.name};
      if ($scope.newSpaceData.defaultLocale)
        data.defaultLocale = $scope.newSpaceData.defaultLocale;

      var orgId = $scope.selectedOrganization.sys.id;
      if(!$scope.canCreateSpaceInOrg(orgId)){
        stopSpinner();
        $scope.dialog.cancel();
        return notification.error('You can\'t create a Space in this Organization');
      }

      client.createSpace(data, orgId)
      .then(function(newSpace){
        $scope.performTokenLookup()
        .then(function () {
          var space = _.find($scope.spaces, function (space) {
            return space.getId() == newSpace.getId();
          });
          $scope.selectSpace(space);
          $scope.lockSubmit = false;
          $scope.dialog.confirm();
          notification.info('Created space "'+ space.data.name +'"');
          resetNewSpaceData();
        });
      })
      .catch(function(err){
        var dismiss = true, method = 'serverError';
        var errorMessage = 'Could not create Space';
        var usage = enforcements.computeUsage('space');
        if(usage){
          errorMessage = usage;
          var enforcement = enforcements.determineEnforcement('usageExceeded');
          $rootScope.$broadcast('persistentNotification', {
            message: enforcement.message,
            tooltipMessage: enforcement.description,
            actionMessage: enforcement.actionMessage,
            action: enforcement.action
          });
          method = 'warn';
        } else if(hasErrorOnField(err, 'length', 'name')){
          errorMessage = 'Space name is too long';
          dismiss = false;
          method = 'warn';
        }

        notification[method](errorMessage, err);

        if(dismiss){
          $scope.lockSubmit = false;
          $scope.dialog.cancel();
        }
      })
      .finally(function(){
        stopSpinner();
      });

    };
  }
]);
