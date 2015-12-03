'use strict';

angular.module('contentful').controller('ClientController', ['$scope', '$injector', function ClientController($scope, $injector) {
  var $rootScope         = $injector.get('$rootScope');
  var $controller        = $injector.get('$controller');
  var $timeout           = $injector.get('$timeout');
  var $location          = $injector.get('$location');
  var $state             = $injector.get('$state');
  var features           = $injector.get('features');
  var logger             = $injector.get('logger');
  var spaceContext       = $injector.get('spaceContext');
  var authentication     = $injector.get('authentication');
  var tokenStore         = $injector.get('tokenStore');
  var notification       = $injector.get('notification');
  var analytics          = $injector.get('analytics');
  var authorization      = $injector.get('authorization');
  var modalDialog        = $injector.get('modalDialog');
  var presence           = $injector.get('presence');
  var enforcements       = $injector.get('enforcements');
  var revision           = $injector.get('revision');
  var ReloadNotification = $injector.get('ReloadNotification');
  var TheAccountView     = $injector.get('TheAccountView');
  var TheStore           = $injector.get('TheStore');
  var OrganizationList   = $injector.get('OrganizationList');
  var PermissionController = $injector.get('PermissionController');

  $controller('TrialWatchController', {$scope: $scope});

  $scope.permissionController = PermissionController;
  $scope.featureController = $controller('FeatureController', {$scope: $scope});
  $scope.spaceContext = spaceContext;

  $scope.preferences = {
    showAuxPanel: false,
    toggleAuxPanel: function() {
      $scope.preferences.showAuxPanel = !$scope.preferences.showAuxPanel;
      analytics.toggleAuxPanel($scope.preferences.showAuxPanel, $state.current.name);
    },
    showDisabledFields: false
  };

  $scope.$watchCollection(function () {
    return {
      space: spaceContext.space,
      tokenLookup: authentication.tokenLookup
    };
  }, spaceAndTokenWatchHandler);

  $scope.$watch('user', userWatchHandler);

  $scope.$on('iframeMessage', iframeMessageWatchHandler);
  $scope.$on('$stateChangeSuccess', stateChangeSuccessHandler);

  // @todo remove it - temporary proxy event handler
  $scope.$on('showCreateSpaceDialog', function(e, id) { showCreateSpaceDialog(id); });

  $scope.initClient = initClient;
  $scope.setTokenDataOnScope = setTokenDataOnScope;
  $scope.showCreateSpaceDialog = showCreateSpaceDialog;

  function initClient() {
    tokenStore.getUpdatedToken()
    .then(function(data) {
      setTokenDataOnScope(data);
      analytics.setUserData($scope.user);
      showOnboardingIfNecessary();
    });

    setTimeout(newVersionCheck, 5000);

    setInterval(function () {
      if (presence.isActive()) {
        newVersionCheck();
        performTokenLookup().
        catch(function () {
          ReloadNotification.trigger('Your authentication data needs to be refreshed. Please try logging in again.');
        });
      }
    }, 5 * 60 * 1000);
  }

  function stateChangeSuccessHandler(event, toState, toStateParams, fromState, fromStateParams) {
    // TODO should be done be `onEnter` and `onExit` callbacks of the 'accounts' state.
    TheAccountView.check();
    // TODO should be done by purpse handler, e.g. in the analytics service
    analytics.stateActivated(toState, toStateParams, fromState, fromStateParams);
  }

  function spaceAndTokenWatchHandler(collection) {
    if (collection.tokenLookup) {
      authorization.setTokenLookup(collection.tokenLookup);
      if (collection.space && authorization.authContext && authorization.authContext.hasSpace(collection.space.getId())) {
        authorization.setSpace(collection.space);
      }
    }
  }

  // @todo this shouldn't be $watch handler - it can be called by `setTokenDataOnScope`
  function userWatchHandler(user) {
    if(user){
      OrganizationList.resetWithUser(user);
      if (features.shouldAllowAnalytics()) {
        logger.enable();
        analytics.enable();
        analytics.setUserData(user);
      } else {
        logger.disable();
        analytics.disable();
      }
    }
  }

  function iframeMessageWatchHandler(event, data) {
    var msg = makeMsgResponder(data);

    if (msg('create', 'UserCancellation')) {
      authentication.goodbye();

    } else if (msg('new', 'space')) {
      $scope.showCreateSpaceDialog(data.organizationId);

    } else if (msg('delete', 'space')) {
      performTokenLookup();
      $location.url('/');

    } else if (data.type === 'flash') {
      showFlashMessage(data);

    } else if (msg('navigate', 'location')) {
      $location.url(data.path);

    } else if (msg('update', 'location')) {
      return;

    } else if (data.token) {
      updateToken(data.token);

    } else {
      performTokenLookup();
    }
  }

  function makeMsgResponder(data) {
    //console.log('iframe message: ', data);
    return function msg(action, type) {
      return data &&
        data.action && data.action.toLowerCase() === action.toLowerCase() &&
        data.type && data.type.toLowerCase() === type.toLowerCase();
    };
  }

  function showFlashMessage(data) {
    var level = data.resource.type;
    if (level && level.match(/error/)) level = 'warn';
    else if (level && !level.match(/info/) || !level) level = 'info';
    notification[level](data.resource.message);
  }

  function updateToken(data) {
    authentication.updateTokenLookup(data);
    if(authentication.tokenLookup) {
      tokenStore.updateTokenFromTokenLookup(authentication.tokenLookup);
      setTokenDataOnScope(tokenStore.getToken());
    } else {
      logger.logError('Token Lookup has not been set properly', {
        data: {
          iframeData: data
        }
      });
    }
  }

  function performTokenLookup() {
    return tokenStore.getUpdatedToken().then(setTokenDataOnScope);
  }

  function setTokenDataOnScope(token) {
    $scope.user = token.user;
    enforcements.setUser(token.user);
    $scope.spaces = token.spaces;
  }

  function newVersionCheck() {
    revision.hasNewVersion().then(function (hasNewVersion) {
      if (hasNewVersion) {
        $rootScope.$broadcast('persistentNotification', {
          message: 'A new application version is available. Please reload to get a new version of the application',
          action: ReloadNotification.triggerImmediateReload,
          actionMessage: 'Reload'
        });
      }
    });
  }

  function showOnboardingIfNecessary() {
    var seenOnboarding = TheStore.get('seenOnboarding');
    var signInCount = $scope.user.signInCount;
    if (signInCount === 1 && !seenOnboarding) {
      showUserPersonaOnboardingModal()
      .finally(function(organizationId) {
        if (_.isEmpty($scope.spaces)) {
          showSpaceTemplatesModal(organizationId);
        }
        TheStore.set('seenOnboarding', true);
        analytics.track('Viewed Onboarding');
      });
    }
  }

  function showCreateSpaceDialog(organizationId) {
    analytics.track('Clicked Create-Space');
    showSpaceTemplatesModal(organizationId);
  }

  function showSpaceTemplatesModal(organizationId) {
    var scope = _.extend($scope.$new(), {
      organizations: OrganizationList.getWithOnTop(organizationId)
    });

    analytics.track('Viewed Space Template Selection Modal');
    modalDialog.open({
      title: 'Space templates',
      template: 'space_templates_dialog',
      scope: scope,
      backgroundClose: false
    })
    .promise
    .then(function (template) {
      if(template){
        analytics.track('Created Space Template', {template: template.name});
        $rootScope.$broadcast('templateWasCreated');
        refreshContentTypes();
      }
    })
    .catch(function() {
      analytics.track('Closed Space Template Selection Modal');
      refreshContentTypes();
    });
  }

  function showUserPersonaOnboardingModal() {
    return modalDialog.open({
      title: 'Select Persona', // Not displayed, just for analytics
      template: 'user_persona_dialog',
      scopeData: {
        userName: $scope.user.firstName
      },
      backgroundClose: false,
      ignoreEsc: true
    })
    .promise;
  }

  function refreshContentTypes() {
    return $timeout(function () {
      spaceContext.refreshContentTypes();
    }, 1000);
  }

}]);
