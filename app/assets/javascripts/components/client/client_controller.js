'use strict';

angular.module('contentful').controller('ClientCtrl', function ClientCtrl(
    $scope, $rootScope, client, SpaceContext, authentication, notification, analytics,
    routing, authorization, tutorial, modalDialog, presence, $location,
    revision, ReloadNotification, $controller, $window) {

  $controller('TrialWatchController', {$scope: $scope});
  $scope.spaces = null;
  $scope.spaceContext = new SpaceContext();

  $scope.notification = notification;

  $scope.startTutorial = function () {
    tutorial.start();
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
    return $scope.spaceContext.tabList.numVisible() === 0;
  };

  function setSpace(space) {
    analytics.setSpaceData(space);
    $scope.spaceContext = new SpaceContext(space);
  }

  $scope.getCurrentSpaceId = function () {
    return $scope.spaceContext &&
           $scope.spaceContext.space &&
           $scope.spaceContext.space.getId();
  };

  $scope.selectSpace = function(space) {
    if(!space){
      return notification.error('Selected space does not exist');
    }
    if (space && $scope.getCurrentSpaceId() === space.getId()) return;
    analytics.track('Switched Space', {
      spaceId: space.getId(),
      spaceName: space.data.name
    });
    routing.goToSpace(space);
  };

  $scope.$on('$routeChangeSuccess', function (event, route) {
    if ($scope.spaces === null) return;

    if (route.params.spaceId != $scope.getCurrentSpaceId()) {
      var space = _.find($scope.spaces, function (space) {
        return space.getId() == route.params.spaceId;
      });
      if (space) setSpace(space);
    }
  });

  $scope.$watch('spaces', function(spaces, old, scope) {
    var routeSpaceId = routing.getSpaceId();
    var newSpace;

    if (spaces === old) return; // $watch init
    if (routeSpaceId) {
      newSpace = _.find(spaces, function (space) {
        return space.getId() == routeSpaceId;
      });
      if (!newSpace) {
        if (old === null) notification.error('Space does not exist or is unaccessable');
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

  $scope.logout = function() {
    analytics.track('Clicked Logout');
    authentication.logout();
  };

  $scope.openSupport = function() {
    $window.open(authentication.supportUrl());
  };

  $scope.$on('iframeMessage', function (event, data) {
    if (data.type === 'space' && data.action === 'update') {
      _.extend($scope.spaceContext.space.data, data.resource);
      //TODO this is pobably much too simplified, better look up correct
      //space and check if the method of updating is correct
    } else if (data.type === 'UserCancellation' && data.action === 'create') {
      authentication.goodbye();
    } else if (data.type === 'user' && data.action === 'update') {
      _.extend($scope.user, data.resource);
    /*
     * This does not work yet because when you mix relational databases and
     * object graphs you're gonna have a bad time, mkay?
     *
    } else if (data.action !== 'delete') {
      authentication.updateTokenLookup(data.resource);
      $scope.user = authentication.tokenLookup.sys.createdBy;
      $scope.updateSpaces(authentication.tokenLookup.spaces);
    } else if (data.token) {
     */
      authentication.setTokenLookup(data.token);
      $scope.user = authentication.tokenLookup.sys.createdBy;
      $scope.updateSpaces(authentication.tokenLookup.spaces);
    } else if (data.type === 'flash') {
      var level = data.resource.type;
      if (!level.match(/info|error/)) level = 'info';
      notification[level](data.resource.message);
    } else if (data.type === 'location') {
      // ignore
    } else {
      $scope.performTokenLookup();
    }
    // TODO Better handle deletes (should also work somehow without data.token)
  });

  $scope.clickedProfileButton = function () {
    analytics.track('Clicked Profile Button');
  };

  $scope.goToProfile = function (pathSuffix) {
    pathSuffix = pathSuffix || 'user';
    $location.path('/profile' + '/' + pathSuffix);
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
    // For now it is impossible to determine if this is allowed
    // TODO: Implement proper check as soon as the information is available
    return true;
  };

  $scope.showCreateSpaceDialog = function () {
    modalDialog.open({
      scope: $scope,
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
      tutorial.start();
    }
  }
});
