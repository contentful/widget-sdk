'use strict';

angular.module('contentful').controller('ClientCtrl', ['$scope', '$injector', function ClientCtrl($scope, $injector) {
  var $rootScope         = $injector.get('$rootScope');
  var client             = $injector.get('client');
  var SpaceContext       = $injector.get('SpaceContext');
  var authentication     = $injector.get('authentication');
  var notification       = $injector.get('notification');
  var analytics          = $injector.get('analytics');
  var routing            = $injector.get('routing');
  var authorization      = $injector.get('authorization');
  var tutorial           = $injector.get('tutorial');
  var modalDialog        = $injector.get('modalDialog');
  var presence           = $injector.get('presence');
  var $location          = $injector.get('$location');
  var enforcements       = $injector.get('enforcements');
  var reasonsDenied      = $injector.get('reasonsDenied');
  var revision           = $injector.get('revision');
  var ReloadNotification = $injector.get('ReloadNotification');
  var $controller        = $injector.get('$controller');
  var $window            = $injector.get('$window');

  $controller('TrialWatchController', {$scope: $scope});
  $scope.spaces = null;
  $scope.spaceContext = new SpaceContext();

  $scope.notification = notification;

  $scope.startTutorial = function () {
    tutorial.start().catch(function () {
      notification.error('Could not create tutorial space');
    });
  };

  $scope.preferences = {
    showAuxPanel: false,

    toggleAuxPanel: function() {
      $scope.preferences.showAuxPanel = !$scope.preferences.showAuxPanel;
      analytics.toggleAuxPanel($scope.preferences.showAuxPanel, $scope.spaceContext.tabList.current);
    },

    showDisabledFields: false
  };

  $scope.user = null;
  $scope.organizations = null;

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

  $scope.clickedSpaceSwitcher = function () {
    analytics.track('Clicked Space-Switcher');
  };

  $scope.$watchCollection(function (scope) {
    return {
      space: scope.spaceContext.space,
      tokenLookup: authentication.tokenLookup
    };
  }, function (collection) {
    if (collection.tokenLookup){
      authorization.setTokenLookup(collection.tokenLookup);
      if (collection.space && authorization.authContext && authorization.authContext.hasSpace(collection.space.getId()))
        authorization.setSpace(collection.space);
    }
  });

  $scope.hideTabBar = function () {
    return $scope.spaceContext.tabList.numVisible() === 0 || $scope.locationInAccount;
  };

  function setSpace(space) {
    analytics.setSpaceData(space);
    $scope.spaceContext = new SpaceContext(space);
    enforcements.setSpaceContext($scope.spaceContext);
  }

  $scope.getCurrentSpaceId = function () {
    return $scope.spaceContext &&
           $scope.spaceContext.space &&
           $scope.spaceContext.space.getId();
  };

  $scope.selectSpace = function(space) {
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
  };

  function isOrgOwner(org) {
    return org.sys.createdBy.sys.id === $scope.user.sys.id;
  }

  $scope.selectOrg = function(orgId) {
    if(!$scope.canSelectOrg(orgId)) return false;
    var org = getOrgById(orgId);
    analytics.track('Switched Organization', {
      organizationId: orgId,
      organizationName: $scope.getOrgName(orgId)
    });
    routing.goToOrganization(orgId, isOrgOwner(org));
    return true;
  };

  $scope.canSelectOrg = function (orgId) {
    var query = _.where($scope.user.organizationMemberships, {organization: {sys: {id: orgId}}});
    return query.length > 0 && (query[0].role == 'admin' || query[0].role == 'owner');
  };

  $scope.$on('$routeChangeSuccess', function (event, route) {
    $scope.locationInAccount = route.viewType === 'account';

    if ($scope.spaces !== null && route.params.spaceId != $scope.getCurrentSpaceId()) {
      var space = _.find($scope.spaces, function (space) {
        return space.getId() == route.params.spaceId;
      });
      if (space) setSpace(space);
    }
  });

  function getOrgById(id) {
    var query = _.where($scope.organizations, {sys: {id: id}});
    if(query.length > 0){
      return query[0];
    }
    return null;
  }

  $scope.getOrgName = function (orgId) {
    var org = getOrgById(orgId);
    if(org){
      return org.name;
    }
    return '';
  };

  function groupSpacesByOrg(spaces) {
    return _.groupBy(spaces, function(space){
      return space.data.organization.sys.id;
    });
  }

  $scope.$watch('spaces', function(spaces, old, scope) {
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
  });

  $scope.$watch('user', function (user) {
    if(user){
      $scope.organizations = _.pluck(user.organizationMemberships, 'organization');
      analytics.setUserData(user);
    }
  });

  $scope.logout = function() {
    analytics.track('Clicked Logout');
    authentication.logout();
  };

  $scope.openSupport = function() {
    $window.open(authentication.supportUrl());
  };

  $scope.$on('iframeMessage', function (event, data) {
    //console.log('iframe message: ', data);

    function msg(action, type) {
      return data &&
        data.action && data.action.toLowerCase() === action.toLowerCase() &&
        data.type && data.type.toLowerCase() === type.toLowerCase();
    }

    if (msg('create', 'UserCancellation')) {
      authentication.goodbye();

    } else if (msg('new', 'space')) {
      $scope.showCreateSpaceDialog(data.organizationId);

    } else if (data.type === 'flash') {
      var level = data.resource.type;
      if (!level.match(/info|error/)) level = 'info';
      notification[level](data.resource.message);

    } else if (msg('navigate', 'location')) {
      $location.path(data.path);

    } else if (msg('update', 'location')) {
      return;

    } else if (data.token) {
      authentication.setTokenLookup(data.token);
      $scope.user = authentication.tokenLookup.sys.createdBy;
      $scope.updateSpaces(authentication.tokenLookup.spaces);

    } else {
      $scope.performTokenLookup();
    }
  });

  $scope.clickedProfileButton = function () {
    analytics.track('Clicked Profile Button');
  };

  $scope.goToAccount = function (pathSuffix) {
    pathSuffix = pathSuffix || 'profile/user';
    $location.path('/account' + '/' + pathSuffix);
  };

  $scope.performTokenLookup = function () {
    return authentication.getTokenLookup().then(function (tokenLookup) {
      $scope.user = tokenLookup.sys.createdBy;
      $scope.updateSpaces(tokenLookup.spaces);
    });
  };

  $scope.updateSpaces = function (rawSpaces) {
    var newSpaceList = _.map(rawSpaces, function (rawSpace) {
      var existing = _.find($scope.spaces, function (existingSpace) {
        return existingSpace.getId() == rawSpace.sys.id;
      });
      if (existing) {
        existing.update(rawSpace);
        return existing;
      } else {
        var space = client.wrapSpace(rawSpace);
        space.save = function () { throw new Error('Saving space not allowed'); };
        return space;
      }
    });
    newSpaceList.sort(function (a,b) {
      return a.data.name.localeCompare(b.data.name);
    });
    $scope.spaces = newSpaceList;
  };

  $scope.canCreateSpace = function () {
    var response;
    if(authorization.authContext && $scope.organizations && $scope.organizations.length > 0){
      if(!$scope.canCreateSpaceInAnyOrg()) return false;

      response = authorization.authContext.can('create', 'Space');
      if(!response){
        $scope.checkForEnforcements('create', 'Space');
      }
    }
    return !!response;
  };

  $scope.canCreateSpaceInAnyOrg = function () {
    return _.some($scope.organizations, function (org) {
      return $scope.canCreateSpaceInOrg(org.sys.id);
    });
  };

  $scope.canCreateSpaceInOrg = function (orgId) {
    return authorization.authContext && authorization.authContext.organization(orgId).can('create', 'Space');
  };

  $scope.checkForEnforcements = function () {
    var enforcement = enforcements.determineEnforcement(reasonsDenied.apply(null, arguments), arguments[1]);
    if(enforcement) {
      $rootScope.$broadcast('persistentNotification', {
        message: enforcement.message,
        tooltipMessage: enforcement.description,
        actionMessage: enforcement.actionMessage,
        action: enforcement.action
      });
    }
  };

  $scope.showCreateSpaceDialog = function (organizationId) {
    var scope = $scope;
    if (organizationId) {
      scope = $scope.$new();
      scope.organizations = scope.organizations.concat();
      scope.organizations.sort(function (a, b) {
        if (a.sys.id === organizationId) return -1;
        if (b.sys.id === organizationId) return 1;
        else return 0;
      });
    }
    modalDialog.open({
      scope: scope,
      template: 'create_space_dialog'
    });
    analytics.track('Clicked Create-Space');
  };

  $scope.initClient = function () {
    $scope.performTokenLookup().
      then(function () {
        analytics.login($scope.user);
        showTutorialIfNecessary();
      }, function () {
        notification.error('Token Lookup failed. Logging out.');
        authentication.logout();
      });

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
  };

  function showTutorialIfNecessary() {
    var now = moment();
    var created = moment($scope.user.sys.createdAt);
    var age = now.diff(created, 'days');
    var seenTutorial = tutorial.getSeen();
    if (age < 7 && !seenTutorial && !_.isEmpty($scope.spaces)) {
      tutorial.start().catch(function () {
        tutorial.setSeen();
      });
    }
  }
}]);
