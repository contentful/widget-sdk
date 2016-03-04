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
  var analyticsEvents    = $injector.get('analyticsEvents');
  var authorization      = $injector.get('authorization');
  var modalDialog        = $injector.get('modalDialog');
  var presence           = $injector.get('presence');
  var enforcements       = $injector.get('enforcements');
  var revision           = $injector.get('revision');
  var ReloadNotification = $injector.get('ReloadNotification');
  var TheAccountView     = $injector.get('TheAccountView');
  var TheStore           = $injector.get('TheStore');
  var OrganizationList   = $injector.get('OrganizationList');
  var spaceTools         = $injector.get('spaceTools');

  $scope.featureController = $controller('FeatureController', {$scope: $scope});
  $scope.spaceContext = spaceContext;

  $scope.preferences = {
    showAuxPanel: false,
    toggleAuxPanel: function() {
      var showAuxPanel = !$scope.preferences.showAuxPanel;
      $scope.preferences.showAuxPanel = showAuxPanel;
      analyticsEvents.trackToggleAuxPanel(showAuxPanel, $state.current.name);
    },
    showDisabledFields: false
  };

  $scope.$watchCollection(function () {
    return {
      space: spaceContext.space,
      tokenLookup: authentication.tokenLookup
    };
  }, spaceAndTokenWatchHandler);

  var off = tokenStore.changed.attach(handleTokenData);
  $scope.$on('$destroy', off);
  $scope.$on('iframeMessage', iframeMessageWatchHandler);
  $scope.$on('$stateChangeSuccess', stateChangeSuccessHandler);

  // @todo remove it - temporary proxy event handler
  $scope.$on('showCreateSpaceDialog', showCreateSpaceDialog);

  $scope.initClient = initClient;
  $scope.showCreateSpaceDialog = showCreateSpaceDialog;

  function initClient() {
    tokenStore.refresh()
    .then(showOnboardingIfNecessary);

    setTimeout(newVersionCheck, 5000);

    setInterval(function () {
      if (presence.isActive()) {
        newVersionCheck();
        tokenStore.refresh().
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

  function iframeMessageWatchHandler(event, data) {
    var msg = makeMsgResponder(data);

    if (msg('create', 'UserCancellation')) {
      authentication.goodbye();

    } else if (msg('new', 'space')) {
      $scope.showCreateSpaceDialog();

    } else if (msg('delete', 'space')) {
      spaceTools.leaveCurrent();

    } else if (data.type === 'flash') {
      showFlashMessage(data);

    } else if (msg('navigate', 'location')) {
      $location.url(data.path);

    } else if (msg('update', 'location')) {
      return;

    } else if (data.token) {
      updateToken(data.token);

    } else {
      tokenStore.refresh();
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
      tokenStore.refreshWithLookup(authentication.tokenLookup);
    } else {
      logger.logError('Token Lookup has not been set properly', {
        data: {
          iframeData: data
        }
      });
    }
  }

  function handleTokenData(token) {
    var user = dotty.get(token, 'user');
    if (!_.isObject(user)) { return; }

    $scope.user = user;
    enforcements.setUser(user);
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
      showOnboardingModal();
    }
  }

  function showCreateSpaceDialog() {
    analytics.track('Clicked Create-Space');
    modalDialog.open({
      title: 'Space templates',
      template: 'create_new_space_dialog',
      backgroundClose: false,
      persistOnNavigation: true
    })
    .promise
    .then(handleTemplateCreation)
    .catch(function() {
      analytics.track('Closed Space Template Selection Modal');
      refreshContentTypes();
    });
  }


  function showOnboardingModal() {
    modalDialog.open({
      title: 'Onboarding', // Not displayed, just for analytics
      template: 'onboarding_dialog',
      persistOnNavigation: true,
      backgroundClose: false,
      ignoreEsc: true,
      scopeData: {
        isOnboarding: true
      }
    })
    .promise
    .then(handleTemplateCreation);
  }

  function handleTemplateCreation(template) {
    if (template) {
      analytics.track('Created Space Template', {template: template.name});
      $rootScope.$broadcast('reloadEntries');
      refreshContentTypes();
    }
  }

  function refreshContentTypes() {
    return $timeout(function () {
      spaceContext.refreshContentTypes();
    }, 1000);
  }

}]);
