angular.module('contentful').controller('ClientCtrl', function ClientCtrl($scope, client, SpaceContext, authentication, contentfulClient, notification, cfSpinner, analytics, routing, authorization, tutorial) {
  'use strict';

  $scope.spaces = [];
  $scope.spaceContext = new SpaceContext();
  $scope.tokenIdentityMap = new contentfulClient.IdentityMap();

  $scope.notification = notification;

  $scope.startTutorial = function () {
    tutorial.start();
  };

  $scope.preferences = {
    showAuxPanel: false,

    toggleAuxPanel: function() {
      $scope.preferences.showAuxPanel = !$scope.preferences.showAuxPanel;
      analytics.toggleAuxPanel($scope.preferences.showAuxPanel, $scope.spaceContext.tabList.current);
    }
  };

  $scope.user = null;

  $scope.clickedSpaceSwitcher = function () {
    analytics.track('Clicked Space-Switcher');
  };

  $scope.$watch('spaceContext.space', function (space) {
    authorization.setSpace(space);
  });

  function setSpace(space) {
    analytics.setSpaceData(space);
    authorization.setSpace(space);
    $scope.spaceContext = new SpaceContext(space);
  }

  $scope.getCurrentSpaceId = function () {
    return $scope.spaceContext &&
           $scope.spaceContext.space &&
           $scope.spaceContext.space.getId();
  };

  $scope.selectSpace = function(space) {
    if (space && $scope.getCurrentSpaceId() === space.getId()) return;
    
    setSpace(space);
    analytics.track('Switched Space', {
      spaceId: space.data.sys.id,
      spaceName: space.data.name
    });
  };

  $scope.$on('tabBecameActive', function (event, tab) {
    routing.setTab(tab, event.currentScope.spaceContext.space);
  });

  $scope.$on('$routeChangeSuccess', function (event, route) {
    if (route.noNavigate) return;
    if (route.params.spaceId != $scope.getCurrentSpaceId()) {
      var space = _.find($scope.spaces, function (space) {
        return space.getId() == route.params.spaceId;
      });
      if (space) setSpace(space);
    }
  });

  $scope.$watch('spaces', function(spaces) {
    if (_.contains(spaces, $scope.spaceContext.space)) return;
    var spaceIdFromRoute = routing.getSpaceId();
    var initialSpace = _.find(spaces, function (space) {
      return space.getId() == spaceIdFromRoute; }) || spaces[0];
    setSpace(initialSpace);
  });

  $scope.logout = function() {
    analytics.track('Clicked Logout');
    authentication.logout();
  };

  $scope.openSupport = function() {
    window.open(authentication.supportUrl());
  };

  $scope.$on('iframeMessage', function (event, message) {
    if (message.type === 'space' && message.action === 'update') {
      _.extend($scope.spaceContext.space.data, message.resource);
      //TODO this is pobably much too simplified, better look up correct
      //space and check if the method of updating is correct
    } else if (message.type === 'user' && message.action === 'update') {
      _.extend($scope.user, message.resource);
    /*
     * This does not work yet because when you mix relational databases and
     * object graphs you're gonna have a bad time, mkay?
     *
    } else if (message.action !== 'delete') {
      authentication.updateTokenLookup(message.resource);
      $scope.user = authentication.tokenLookup.sys.createdBy;
      $scope.updateSpaces(authentication.tokenLookup.spaces);
    } else if (message.token) {
     */
      authentication.setTokenLookup(message.token);
      authorization.setTokenLookup(message.token, $scope.spaceContext.space);
      $scope.user = authentication.tokenLookup.sys.createdBy;
      $scope.updateSpaces(authentication.tokenLookup.spaces);
    } else if (message.type === 'flash') {
      var level = message.resource.type;
      if (!level.match(/info|error/)) level = 'info';
      notification[level](message.resource.message);
    } else if (message.type === 'location') {
      // ignore
    } else {
      $scope.performTokenLookup();
    }
    // TODO Better handle deletes (should also work somehow without message.token)
  });

  $scope.clickedProfileButton = function () {
    analytics.track('Clicked Profile Button');
  };

  $scope.editProfile = function() {
    var options = {
      viewType: 'iframe',
      section: null,
      params: {
        url: authentication.profileUrl(),
        fullscreen: true
      },
      title: 'Profile'
    };

    analytics.track('Clicked Profile');

    // TODO This is a pattern that repeats and should be extracted
    var tab = _.find($scope.spaceContext.tabList.items, function(tab) {
      return tab.viewType === options.viewType && tab.section === options.section;
    });
    tab = tab || $scope.spaceContext.tabList.add(options);
    tab.activate();
  };


  $scope.performTokenLookup = function (callback) {
    // TODO initialize blank user so that you can at least log out when
    // the getTokenLookup fails
    var stopSpinner = cfSpinner.start();
    authentication.getTokenLookup(function(tokenLookup) {
      $scope.$apply(function(scope) {
        //console.log('tokenLookup', tokenLookup);
        scope.user = tokenLookup.sys.createdBy;
        authorization.setTokenLookup(tokenLookup);
        analytics.login(scope.user);
        scope.updateSpaces(tokenLookup.spaces);
        if (callback) callback(tokenLookup);
      });
      stopSpinner();
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
    $scope.displayCreateSpaceDialog = true;
    analytics.track('Clicked Create-Space');
  };

  $scope.hideCreateSpaceDialog = function () {
    $scope.displayCreateSpaceDialog = false;
  };

  $scope.performTokenLookup();
});
