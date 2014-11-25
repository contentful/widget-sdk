'use strict';

angular.module('contentful').controller('CreateSpaceDialogController', [ '$scope', '$injector', function CreateSpaceDialogController($scope, $injector) {
    var $rootScope   = $injector.get('$rootScope');
    var cfSpinner    = $injector.get('cfSpinner');
    var client       = $injector.get('client');
    var enforcements = $injector.get('enforcements');
    var logger       = $injector.get('logger');
    var notification = $injector.get('notification');

    $scope.writableOrganizations = _.filter($scope.organizations, function (org) {
      return org && org.sys ? $scope.canCreateSpaceInOrg(org.sys.id) : false;
    });

    resetNewSpaceData();

    $scope.selectOrganization = function (org) {
      $scope.selectedOrganization = org;
    };

    if($scope.writableOrganizations.length > 0){
      $scope.selectOrganization($scope.writableOrganizations[0]);
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
        logger.logError('You can\'t create a Space in this Organization');
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
          $rootScope.$broadcast('spaceCreated');
        });
      })
      .catch(function(err){
        var dismiss = true;
        var usage = enforcements.computeUsage('space');
        if(usage){
          var enforcement = enforcements.determineEnforcement('usageExceeded');
          $rootScope.$broadcast('persistentNotification', {
            message: enforcement.message,
            tooltipMessage: enforcement.description,
            actionMessage: enforcement.actionMessage,
            action: enforcement.action
          });
          notification.warn(usage);
        } else if(hasErrorOnField(err, 'length', 'name')){
          dismiss = false;
          notification.warn('Space name is too long');
        } else {
          notification.error('Could not create Space');
          logger.logServerError('Could not create Space', {error: err});
        }

        if(dismiss){
          $scope.lockSubmit = false;
          $scope.dialog.cancel();
        }
      })
      .finally(function(){
        stopSpinner();
      });
    };

    function hasErrorOnField(err, error, field) {
      var errors = dotty.get(err, 'body.details.errors');
      if(errors && errors.length > 0){
        return errors[0].path == field &&
               errors[0].name == error;
      }
      return false;
    }

    function resetNewSpaceData() {
      $scope.newSpaceData = _.cloneDeep({defaultLocale: 'en-US'});
      $scope.lockSubmit = false;
    }

  }
]);
