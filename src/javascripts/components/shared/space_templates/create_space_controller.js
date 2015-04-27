'use strict';

angular.module('contentful').controller('CreateSpaceDialogController', [ '$scope', '$injector', function CreateSpaceDialogController($scope, $injector) {
    var $rootScope   = $injector.get('$rootScope');
    var $timeout     = $injector.get('$timeout');
    var cfSpinner    = $injector.get('cfSpinner');
    var client       = $injector.get('client');
    var tokenStore   = $injector.get('tokenStore');
    var enforcements = $injector.get('enforcements');
    var logger       = $injector.get('logger');
    var notification = $injector.get('notification');

    $scope.createSpace = createSpace;
    $scope.selectOrganization = selectOrganization;

    resetNewSpaceData();
    setupOrganizations();

    function createSpace() {
      $rootScope.$broadcast('spaceCreationRequested');
      var stopSpinner = cfSpinner.start();
      var data = {name: $scope.newSpaceData.name};
      if ($scope.newSpaceData.defaultLocale)
        data.defaultLocale = $scope.newSpaceData.defaultLocale;

      var orgId = $scope.selectedOrganization.sys.id;
      if(!$scope.permissionController.canCreateSpaceInOrg(orgId)){
        stopSpinner();
        $rootScope.$broadcast('spaceCreationFailed');
        logger.logError('You can\'t create a Space in this Organization');
        return notification.error('You can\'t create a Space in this Organization');
      }


      client.createSpace(data, orgId)
      .then(function(newSpace){
        tokenStore.getUpdatedToken()
        .then(_.partialRight(handleSpaceCreation, newSpace));
      })
      .catch(handleSpaceCreationFailure)
      .finally(function(){
        stopSpinner();
      });
    }

    function handleSpaceCreation(token, newSpace) {
      $scope.setTokenDataOnScope(token);
      tokenStore.getSpace(newSpace.getId())
      .then(function (space) {
        var broadcastSpaceCreated = $rootScope.$on('$stateChangeSuccess', function () {
          broadcastSpaceCreated();
          $timeout(function () {
            $scope.$emit('spaceCreated', space);
          }, 500);
        });
        $scope.selectSpace(space);
      });
    }

    function handleSpaceCreationFailure(err){
      $rootScope.$broadcast('spaceCreationFailed');
      var usage = enforcements.computeUsage('space');
      if(usage){
        handleUsageWarning(usage);
      } else if(hasErrorOnField(err, 'length', 'name')){
        notification.warn('Space name is too long');
      } else {
        notification.error('Could not create Space');
        logger.logServerWarn('Could not create Space', {error: err});
      }
    }

    function handleUsageWarning(usage) {
      var enforcement = enforcements.determineEnforcement('usageExceeded');
      $rootScope.$broadcast('persistentNotification', {
        message: enforcement.message,
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
        return org && org.sys ? $scope.permissionController.canCreateSpaceInOrg(org.sys.id) : false;
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
