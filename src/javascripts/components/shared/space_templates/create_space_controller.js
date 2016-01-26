'use strict';

angular.module('contentful').controller('CreateSpaceDialogController', [ '$scope', '$injector', function CreateSpaceDialogController($scope, $injector) {
    var $rootScope    = $injector.get('$rootScope');
    var $timeout      = $injector.get('$timeout');
    var client        = $injector.get('client');
    var tokenStore    = $injector.get('tokenStore');
    var enforcements  = $injector.get('enforcements');
    var logger        = $injector.get('logger');
    var spaceTools    = $injector.get('spaceTools');
    var accessChecker = $injector.get('accessChecker');

    $scope.createSpace = createSpace;
    $scope.selectOrganization = selectOrganization;

    resetNewSpaceData();
    setupOrganizations();
    resetErrors();

    function resetErrors() {
      $scope.errors = { fields: {} };
    }

    function showFieldError(field, error) {
      $scope.errors.fields[field] = error;
    }

    function showFormError(error) {
      resetErrors();
      $scope.errors.form = error;
    }

    function createSpace() {
      $rootScope.$broadcast('spaceCreationRequested');
      var data = {name: $scope.newSpaceData.name};
      if ($scope.newSpaceData.defaultLocale)
        data.defaultLocale = $scope.newSpaceData.defaultLocale;

      var orgId = $scope.selectedOrganization.sys.id;
      if (!accessChecker.canCreateSpaceInOrganization(orgId)) {
        $rootScope.$broadcast('spaceCreationFailed');
        logger.logError('You can\'t create a Space in this Organization');
        return showFormError('You can\'t create a Space in this Organization');
      }


      client.createSpace(data, orgId)
      .then(function(newSpace){
        tokenStore.getUpdatedToken()
        .then(_.partialRight(handleSpaceCreation, newSpace));
      })
      .catch(handleSpaceCreationFailure);
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
        spaceTools.goTo(space, true);
      },
      handleSpaceCreationFailure);
    }

    function handleSpaceCreationFailure(err) {
      var errors = dotty.get(err, 'body.details.errors');
      var usage = enforcements.computeUsage('space');

      var fieldErrors = [
        {name: 'length', path: 'name', message: 'Space name is too long'},
        {name: 'invalid', path: 'default_locale', message: 'Invalid locale'}
      ];

      $rootScope.$broadcast('spaceCreationFailed');

      if (usage) {
        handleUsageWarning(usage);
        return;
      }

      resetErrors();

      _.forEach(fieldErrors, function(e) {
        if (hasErrorOnField(errors, e.path, e.name)) {
          showFieldError(e.path, e.message);
        }
      });

      if (!errors || !errors.length) {
        showFormError('Could not create Space. If the problem persists please get in contact with us.');
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
      showFormError(usage);
    }

    function hasErrorOnField(errors, fieldPath, errorName) {
      return _.some(errors, function(e) {
         return e.path === fieldPath && e.name === errorName;
      });
    }

    function selectOrganization(org) {
      $scope.selectedOrganization = org;
    }

    function setupOrganizations() {
      $scope.writableOrganizations = _.filter($scope.organizations, function (org) {
        return org && org.sys ? accessChecker.canCreateSpaceInOrganization(org.sys.id) : false;
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
