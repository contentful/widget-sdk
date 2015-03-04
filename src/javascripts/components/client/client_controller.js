'use strict';

angular.module('contentful').controller('ClientController', ['$scope', '$injector', function ClientController($scope, $injector) {
  var $rootScope         = $injector.get('$rootScope');
  var $q                 = $injector.get('$q');
  var client             = $injector.get('client');
  var features           = $injector.get('features');
  var logger             = $injector.get('logger');
  var SpaceContext       = $injector.get('SpaceContext');
  var authentication     = $injector.get('authentication');
  var notification       = $injector.get('notification');
  var analytics          = $injector.get('analytics');
  var routing            = $injector.get('routing');
  var authorization      = $injector.get('authorization');
  var modalDialog        = $injector.get('modalDialog');
  var presence           = $injector.get('presence');
  var $location          = $injector.get('$location');
  var enforcements       = $injector.get('enforcements');
  var reasonsDenied      = $injector.get('reasonsDenied');
  var revision           = $injector.get('revision');
  var ReloadNotification = $injector.get('ReloadNotification');
  var $controller        = $injector.get('$controller');
  var $window            = $injector.get('$window');
  var $timeout           = $injector.get('$timeout');

  $controller('TrialWatchController', {$scope: $scope});

  $scope.permissionController = $controller('PermissionController', {$scope: $scope});
  $scope.featureController    = $controller('FeatureController'   , {$scope: $scope});
  $scope.spaces = null;
  $scope.user = null;
  $scope.organizations = null;
  $scope.spaceContext = new SpaceContext();
  $scope.notification = notification;

  $scope.preferences = {
    showAuxPanel: false,
    toggleAuxPanel: function() {
      $scope.preferences.showAuxPanel = !$scope.preferences.showAuxPanel;
      analytics.toggleAuxPanel($scope.preferences.showAuxPanel, $scope.spaceContext.tabList.current);
    },
    showDisabledFields: false
  };

  $scope.$watchCollection(function (scope) {
    return {
      space: scope.spaceContext.space,
      tokenLookup: authentication.tokenLookup
    };
  }, spaceAndTokenWatchHandler);

  $scope.$watch('spaces', spaceWatchHandler);
  $scope.$watch('user', userWatchHandler);

  $scope.$on('iframeMessage', iframeMessageWatchHandler);
  $scope.$on('$routeChangeSuccess', routeChangeSuccessHandler);

  $scope.initClient = initClient;
  $scope.clickedSpaceSwitcher = clickedSpaceSwitcher;
  $scope.hideTabBar = hideTabBar;
  $scope.getCurrentSpaceId = getCurrentSpaceId;
  $scope.selectSpace = selectSpace;
  $scope.selectOrg = selectOrg;
  $scope.canSelectOrg = canSelectOrg;
  $scope.getOrgName = getOrgName;
  $scope.logout = logout;
  $scope.openSupport = openSupport;
  $scope.clickedProfileButton = clickedProfileButton;
  $scope.goToAccount = goToAccount;
  $scope.performTokenLookup = performTokenLookup;
  $scope.canCreateSpace = canCreateSpace;
  $scope.canCreateSpaceInAnyOrg = canCreateSpaceInAnyOrg;
  $scope.canCreateSpaceInOrg = canCreateSpaceInOrg;
  $scope.checkForEnforcements = checkForEnforcements;
  $scope.showCreateSpaceDialog = showCreateSpaceDialog;

  function routeChangeSuccessHandler(event, route) {
    $scope.locationInAccount = route.viewType === 'account';

    if ($scope.spaces !== null && route.params.spaceId != $scope.getCurrentSpaceId()) {
      var space = _.find($scope.spaces, function (space) {
        return space.getId() == route.params.spaceId;
      });
      if (space) setSpace(space);
    }
  }

  function iframeMessageWatchHandler(event, data) {
    var msg = makeMsgResponder(data);

    if (msg('create', 'UserCancellation')) {
      authentication.goodbye();

    } else if (msg('new', 'space')) {
      $scope.showCreateSpaceDialog(data.organizationId);

    } else if (data.type === 'flash') {
      showFlashMessage(data);

    } else if (msg('navigate', 'location')) {
      $location.path(data.path);

    } else if (msg('update', 'location')) {
      return;

    } else if (data.token) {
      updateToken(data.token);

    } else {
      $scope.performTokenLookup();
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
      $scope.user = authentication.tokenLookup.sys.createdBy;
      updateSpaces(authentication.tokenLookup.spaces);
    } else {
      logger.logError('Token Lookup has not been set properly', {
        data: {
          iframeData: data
        }
      });
    }
  }

  function performTokenLookup() {
    return authentication.getTokenLookup()
    .then(function (tokenLookup) {
      $scope.user = tokenLookup.sys.createdBy;
      updateSpaces(tokenLookup.spaces);
    })
    .catch(function (err) {
      if (err && err.statusCode === 401) {
        modalDialog.open({
          title: 'Your login token is invalid',
          message: 'You need to login again to refresh your login token.',
          scope: $scope,
          cancelLabel: null,
          confirmLabel: 'Login',
          noBackgroundClose: true,
          attachTo: 'body'
        }).promise.then(function () {
          authentication.logout();
        });
      }
      return $q.reject(err);
    });
  }

  function updateSpaces(rawSpaces) {
    var newSpaceList = _.map(rawSpaces, function (rawSpace) {
      var existing = getExistingSpace(rawSpace.sys.id);
      if (existing) {
        existing.update(rawSpace);
        return existing;
      } else {
        var space = client.newSpace(rawSpace);
        space.save = function () { throw new Error('Saving space not allowed'); };
        return space;
      }
    });
    newSpaceList.sort(function (a,b) {
      return a.data.name.localeCompare(b.data.name);
    });
    $scope.spaces = newSpaceList;
  }

  function getExistingSpace(id) {
    return _.find($scope.spaces, function (existingSpace) {
      return existingSpace.getId() === id;
    });
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

  function spaceWatchHandler(spaces, old, scope) {
    var routeSpaceId = routing.getSpaceId();
    var newSpace;

    if (spaces === old) return; // $watch init

    if(spaces) {
      scope.spacesByOrg = groupSpacesByOrg(spaces);
    }

    if (routeSpaceId) {
      newSpace = _.find(spaces, function (space) {
        return space.getId() == routeSpaceId;
      });
      if (!newSpace) {
        if (old === null) notification.warn('Space does not exist or is unaccessable');
        newSpace = spaces[0];
      }
    } else if (routing.getRoute().root) { // no Space requested, pick first
      newSpace = spaces[0];
    } else {
      return; // we don't want to see a space (but the profile or something else)
    }

    if (!newSpace) {
      $location.path('/');
      setSpace();
      return;
    }

    if (newSpace != scope.spaceContext.space) {
      // we need to change something
      if (routeSpaceId != newSpace.getId()) { // trigger switch by chaning location
        routing.goToSpace(newSpace);
      } else { // location is already correct, just load the space
        setSpace(newSpace);
      }
    }
  }

  function setSpace(space) {
    analytics.setSpace(space);
    $scope.spaceContext = new SpaceContext(space);
    enforcements.setSpaceContext($scope.spaceContext);
  }

  function groupSpacesByOrg(spaces) {
    return _.groupBy(spaces, function(space){
      return space.data.organization.sys.id;
    });
  }

  function initClient() {
    $scope.performTokenLookup()
    .then(function () {
      analytics.setUserData($scope.user);
      showOnboardingIfNecessary();
    }, ReloadNotification.gatekeeperErrorHandler);

    setTimeout(newVersionCheck, 5000);

    setInterval(function () {
      if (presence.isActive()) {
        newVersionCheck();
        $scope.performTokenLookup().
        catch(function () {
          ReloadNotification.trigger('Your authentication data needs to be refreshed. Please try logging in again.');
        });
      }
    }, 5 * 60 * 1000);
  }

  function newVersionCheck() {
    revision.hasNewVersion().catch(function (err) {
      if(err === 'APP_REVISION_CHANGED'){
        $rootScope.$broadcast('persistentNotification', {
          message: 'New application version',
          tooltipMessage: 'Please reload to get a new version of the application',
          action: ReloadNotification.triggerImmediateReload,
          actionMessage: 'Reload'
        });
      }
    });
  }

  function clickedSpaceSwitcher() {
    analytics.track('Clicked Space-Switcher');
  }

  function showOnboardingIfNecessary() {
    var now = moment();
    var created = moment($scope.user.sys.createdAt);
    var age = now.diff(created, 'days');
    var seenOnboarding = $.cookies.get('seenOnboarding');
    if (age < 7 && !seenOnboarding && _.isEmpty($scope.spaces)) {
      $.cookies.set('seenOnboarding', true, {
        expiresAt: moment().add('y', 1).toDate()
      });
      $timeout(function () {
        analytics.track('Viewed Onboarding');
        $timeout(showSpaceTemplatesModal, 1500);
      }, 750);
    }
  }

  function hideTabBar() {
    return $scope.spaceContext.tabList.numVisible() === 0 || $scope.locationInAccount;
  }

  function getCurrentSpaceId() {
    return $scope.spaceContext &&
           $scope.spaceContext.space &&
           $scope.spaceContext.space.getId();
  }

  function selectSpace(space) {
    if(!space){
      return notification.warn('Selected space does not exist');
    }
    if (!$scope.locationInAccount && $scope.getCurrentSpaceId() === space.getId()) return true;
    analytics.track('Switched Space', {
      spaceId: space.getId(),
      spaceName: space.data.name
    });
    routing.goToSpace(space);
    return true;
  }

  function selectOrg(orgId) {
    if(!$scope.canSelectOrg(orgId)) return false;
    var org = getOrgById(orgId);
    analytics.track('Switched Organization', {
      organizationId: orgId,
      organizationName: $scope.getOrgName(orgId)
    });
    routing.goToOrganization(orgId, isOrgOwner(org));
    return true;
  }

  function canSelectOrg(orgId) {
    var query = _.where($scope.user.organizationMemberships, {organization: {sys: {id: orgId}}});
    return query.length > 0 && (query[0].role == 'admin' || query[0].role == 'owner');
  }

  function getOrgName(orgId) {
    var org = getOrgById(orgId);
    if(org){
      return org.name;
    }
    return '';
  }

  function getOrgById(id) {
    var query = _.where($scope.organizations, {sys: {id: id}});
    if(query.length > 0){
      return query[0];
    }
    return null;
  }

  function isOrgOwner(org) {
    return dotty.get(org, 'sys.createdBy.sys.id') === dotty.get($scope.user, 'sys.id');
  }

  function logout() {
    analytics.track('Clicked Logout');
    authentication.logout();
  }

  function openSupport() {
    $window.open(authentication.supportUrl());
  }

  function clickedProfileButton() {
    analytics.track('Clicked Profile Button');
  }

  function goToAccount(pathSuffix) {
    pathSuffix = pathSuffix || 'profile/user';
    $location.path('/account' + '/' + pathSuffix);
  }

  function canCreateSpace() {
    var response;
    if(authorization.authContext && $scope.organizations && $scope.organizations.length > 0){
      if(!$scope.canCreateSpaceInAnyOrg()) return false;

      response = authorization.authContext.can('create', 'Space');
      if(!response){
        $scope.checkForEnforcements('create', 'Space');
      }
    }
    return !!response;
  }

  function canCreateSpaceInAnyOrg() {
    return _.some($scope.organizations, function (org) {
      return $scope.canCreateSpaceInOrg(org.sys.id);
    });
  }

  function canCreateSpaceInOrg(orgId) {
    return authorization.authContext && authorization.authContext.organization(orgId).can('create', 'Space');
  }

  function checkForEnforcements() {
    var enforcement = enforcements.determineEnforcement(reasonsDenied.apply(null, arguments), arguments[1]);
    if(enforcement) {
      $rootScope.$broadcast('persistentNotification', {
        message: enforcement.message,
        tooltipMessage: enforcement.description,
        actionMessage: enforcement.actionMessage,
        action: enforcement.action
      });
    }
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
        .then(_.partial(newTemplateInfoDialog, template.name));
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

  function newTemplateInfoDialog(templateName) {
    if(!$.cookies.get('seenSpaceTemplateInfoDialog')){
      $scope.newContentTemplateName = templateName;
      $timeout(function () {
        modalDialog.open({
          template: 'space_templates_post_dialog',
          scope: $scope
        });
      }, 1000);
    }
  }

}]);
