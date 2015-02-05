'use strict';

angular.module('contentful').controller('CreateSpaceDialogController', [ '$scope', '$injector', function CreateSpaceDialogController($scope, $injector) {
    var $rootScope   = $injector.get('$rootScope');
    var cfSpinner    = $injector.get('cfSpinner');
    var client       = $injector.get('client');
    var enforcements = $injector.get('enforcements');
    var logger       = $injector.get('logger');
    var notification = $injector.get('notification');

    $scope.createSpace = createSpace;
    $scope.selectOrganization = selectOrganization;

    resetNewSpaceData();
    setupOrganizations();

    function createSpace() {
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

      $rootScope.$broadcast('spaceCreationRequested');

      client.createSpace(data, orgId)
      .then(function(newSpace){
        $scope.performTokenLookup()
        .then(_.partial(handleSpaceCreation, newSpace));
      })
      .catch(handleSpaceCreationFailure)
      .finally(function(){
        stopSpinner();
      });
    }

    function handleSpaceCreation(newSpace) {
      var space = _.find($scope.spaces, function (space) {
        return space.getId() == newSpace.getId();
      });
      $scope.selectSpace(space);
      $scope.lockSubmit = false;
      $rootScope.$broadcast('spaceCreated', space);
    }

    function handleSpaceCreationFailure(err){
      $rootScope.$broadcast('spaceCreationFailed');
      var dismiss = true;
      var usage = enforcements.computeUsage('space');
      if(usage){
        handleUsageWarning(usage);
      } else if(hasErrorOnField(err, 'length', 'name')){
        dismiss = false;
        notification.warn('Space name is too long');
      } else {
        notification.error('Could not create Space');
        logger.logServerError('Could not create Space', {error: err});
      }

      $scope.lockSubmit = false;
      if(dismiss){
        $scope.dialog.cancel();
      }
    }

    function handleUsageWarning(usage) {
      var enforcement = enforcements.determineEnforcement('usageExceeded');
      $rootScope.$broadcast('persistentNotification', {
        message: enforcement.message,
        tooltipMessage: enforcement.description,
        actionMessage: enforcement.actionMessage,
        action: enforcement.action
      });
      notification.warn(usage);
    }

    function hasErrorOnField(err, error, field) {
      var errors = dotty.get(err, 'body.details.errors');
      if(errors && errors.length > 0){
        return errors[0].path == field &&
               errors[0].name == error;
      }
      return false;
    }

    function selectOrganization(org) {
      $scope.selectedOrganization = org;
    }

    function setupOrganizations() {
      $scope.writableOrganizations = _.filter($scope.organizations, function (org) {
        return org && org.sys ? $scope.canCreateSpaceInOrg(org.sys.id) : false;
      });
      if($scope.writableOrganizations.length > 0){
        $scope.selectOrganization($scope.writableOrganizations[0]);
      }
    }

    function resetNewSpaceData() {
      $scope.newSpaceData = _.cloneDeep({defaultLocale: 'en-US'});
    }

  }
]);
