'use strict';

angular.module('contentful').controller('ClientController', ['$scope', '$injector', function ClientController($scope, $injector) {
  var $rootScope         = $injector.get('$rootScope');
  var $controller        = $injector.get('$controller');
  var $timeout           = $injector.get('$timeout');
  var $location          = $injector.get('$location');
  var features           = $injector.get('features');
  var logger             = $injector.get('logger');
  var SpaceContext       = $injector.get('SpaceContext');
  var authentication     = $injector.get('authentication');
  var tokenStore         = $injector.get('tokenStore');
  var spacesStore        = $injector.get('spacesStore');
  var notification       = $injector.get('notification');
  var analytics          = $injector.get('analytics');
  var authorization      = $injector.get('authorization');
  var modalDialog        = $injector.get('modalDialog');
  var presence           = $injector.get('presence');
  var enforcements       = $injector.get('enforcements');
  var revision           = $injector.get('revision');
  var ReloadNotification = $injector.get('ReloadNotification');
  var TheAccountView     = $injector.get('TheAccountView');

  $controller('TrialWatchController', {$scope: $scope});

  $scope.permissionController = $controller('PermissionController', {$scope: $scope});
  $scope.featureController    = $controller('FeatureController'   , {$scope: $scope});
  $scope.spaceContext = new SpaceContext();
  $scope.notification = notification;

  $scope.preferences = {
    showAuxPanel: false,
    toggleAuxPanel: function() {
      $scope.preferences.showAuxPanel = !$scope.preferences.showAuxPanel;
      analytics.toggleAuxPanel($scope.preferences.showAuxPanel, $scope.$state.current.name);
    },
    showDisabledFields: false
  };

  $scope.$watchCollection(function (scope) {
    return {
      space: scope.spaceContext.space,
      tokenLookup: authentication.tokenLookup
    };
  }, spaceAndTokenWatchHandler);

  $scope.$watch('user', userWatchHandler);

  $scope.$on('iframeMessage', iframeMessageWatchHandler);
  $scope.$on('$stateChangeSuccess', stateChangeSuccessHandler);

  // @todo remove it - temporary proxy event handlers
  $scope.$on('showCreateSpaceDialog', function(e, id) { showCreateSpaceDialog(id); });
  $scope.$on('selectSpace', function(e, space) { selectSpace(space); });

  $scope.initClient = initClient;
  $scope.setTokenDataOnScope = setTokenDataOnScope;
  $scope.getCurrentSpaceId = getCurrentSpaceId;
  $scope.selectSpace = selectSpace;
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
    TheAccountView.check();
    analytics.stateActivated(toState, toStateParams, fromState, fromStateParams);

    if ($scope.spaces !== null && $scope.$stateParams.spaceId !== $scope.getCurrentSpaceId() && !TheAccountView.isActive()) {
      var space = spacesStore.getSpaceFromList($scope.$stateParams.spaceId, $scope.spaces);
      if (space) {
        setSpaceContext(space);
      } else if (!$scope.$stateParams.spaceId) {
        setSpaceContext($scope.spaces[0]);
      }
    }
  }

  function spaceAndTokenWatchHandler(collection) {
    if (collection.tokenLookup){
      authorization.setTokenLookup(collection.tokenLookup);
      if (collection.space && authorization.authContext && authorization.authContext.hasSpace(collection.space.getId()))
        authorization.setSpace(collection.space);
        $scope.permissionController.initialize(authorization.spaceContext);
    }
  }

  function userWatchHandler(user) {
    if(user){
      $scope.organizations = _.pluck(user.organizationMemberships, 'organization');
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
    $scope.spaces = token.spaces;
  }

  function setSpaceContext(space) {
    $scope.spaceContext = new SpaceContext(space);
    enforcements.setSpaceContext($scope.spaceContext);
    analytics.setSpace(space);
  }

  function selectSpace(space) {
    if(!space){
      return notification.warn('Selected space does not exist');
    }
    if (!TheAccountView.isActive() && $scope.getCurrentSpaceId() === space.getId()) {
      return true;
    }
    analytics.track('Switched Space', {
      spaceId: space.getId(),
      spaceName: space.data.name
    });
    spacesStore.saveSelectedSpace(space.getId());
    $scope.$state.go('spaces.detail', { spaceId: space.getId() });
    return true;
  }

  function newVersionCheck() {
    revision.hasNewVersion().catch(function (err) {
      if(err === 'APP_REVISION_CHANGED'){
        $rootScope.$broadcast('persistentNotification', {
          message: 'A new application version is available. Please reload to get a new version of the application',
          action: ReloadNotification.triggerImmediateReload,
          actionMessage: 'Reload'
        });
      }
    });
  }

  function showOnboardingIfNecessary() {
    var now = moment();
    var created = moment($scope.user.sys.createdAt);
    var age = now.diff(created, 'days');
    var seenOnboarding = $.cookies.get('seenOnboarding');
    if (age < 7 && !seenOnboarding && _.isEmpty($scope.spaces)) {
      $.cookies.set('seenOnboarding', true, {
        expiresAt: moment().add(1, 'y').toDate()
      });
      $timeout(function () {
        analytics.track('Viewed Onboarding');
        $timeout(showSpaceTemplatesModal, 1500);
      }, 750);
    }
  }

  function getCurrentSpaceId() {
    return $scope.spaceContext &&
           $scope.spaceContext.space &&
           $scope.spaceContext.space.getId();
  }

  function showCreateSpaceDialog(organizationId) {
    analytics.track('Clicked Create-Space');
    showSpaceTemplatesModal(organizationId);
  }

  function showSpaceTemplatesModal(organizationId) {
    var scope = $scope.$new();
    setOrganizationsOnScope(scope, organizationId);
    analytics.track('Viewed Space Template Selection Modal');
    modalDialog.open({
      title: 'Space templates',
      template: 'space_templates_dialog',
      ignoreEnter: true,
      ignoreEsc: true,
      noBackgroundClose: true,
      scope: $scope
    })
    .promise
    .then(function (template) {
      if(template){
        analytics.track('Created Successful Space Template');
        $rootScope.$broadcast('templateWasCreated');
        refreshContentTypes()
        .then(_.partial(newTemplateInfoDialog, template));
      }
    })
    .catch(refreshContentTypes);
  }

  function setOrganizationsOnScope(scope, organizationId){
    if (organizationId) {
      scope.organizations = scope.organizations.concat();
      scope.organizations.sort(function (a, b) {
        if (a.sys.id === organizationId) return -1;
        if (b.sys.id === organizationId) return 1;
        else return 0;
      });
    }
  }

  function refreshContentTypes() {
    return $timeout(function () {
      $scope.spaceContext.refreshContentTypes();
    }, 1000);
  }

  function newTemplateInfoDialog(template) {
    if(!$.cookies.get('seenSpaceTemplateInfoDialog')){
      $scope.newContentTemplate = template;
      $timeout(function () {
        modalDialog.open({
          template: 'space_templates_post_dialog',
          scope: $scope
        });
      }, 1000);
    }
  }
}]);
