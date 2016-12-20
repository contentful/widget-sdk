'use strict';

angular.module('contentful')

.factory('handleGatekeeperMessage', ['require', function (require) {
  var $rootScope = require('$rootScope');
  var $location = require('$location');
  var $state = require('$state');
  var authentication = require('authentication');
  var notification = require('notification');
  var TheAccountView = require('TheAccountView');
  var tokenStore = require('tokenStore');
  var ReloadNotification = require('ReloadNotification');
  var logger = require('logger');

  return function handleGatekeeperMessage (data) {
    var match = makeMessageMatcher(data);

    if (match('create', 'UserCancellation')) {
      authentication.goodbye();

    } else if (match('new', 'space')) {
      // @todo move it to service
      $rootScope.$broadcast('showCreateSpaceDialog', data.organizationId);

    } else if (match('delete', 'space')) {
      tokenStore.refresh();
      $state.go('home');

    } else if (data.type === 'flash') {
      showNotification(data);

    } else if (match('navigate', 'location') && data.path) {
      $location.url(data.path);

    } else if (match('update', 'location') && data.path) {
      updateState(data);

    } else if (data.token) {
      updateToken(data.token);

    } else { tokenStore.refresh(); }
  };

  function makeMessageMatcher (data) {
    return function matchMessage (action, type) {
      var messageAction = dotty.get(data, 'action', '').toLowerCase();
      var messageType = dotty.get(data, 'type', '').toLowerCase();

      return action.toLowerCase() === messageAction && type.toLowerCase() === messageType;
    };
  }

  function showNotification (data) {
    var level = dotty.get(data, 'resource.type', 'info');
    var message = dotty.get(data, 'resource.message');

    if (!level) {
      return;
    }

    if (level.match(/error/)) {
      level = 'warn';
    }

    if (message) {
      notification[level](message);
    }
  }

  function updateState (data) {
    var valid = _.isObject(data) && _.isString(data.path);

    // @todo in a long run we want to detect when GK is sending
    // "update location" message w/o a path
    if (valid) {
      var suffix = data.path.match(/account\/(.*)$/);
      TheAccountView.silentlyChangeState(suffix && suffix[1]);
    } else {
      logger.logError('Path for location update not given', {
        gatekeeperData: data
      });
    }
  }

  function updateToken (data) {
    authentication.updateTokenLookup(data);
    if (authentication.tokenLookup) {
      tokenStore.refreshWithLookup(authentication.tokenLookup);
    } else {
      ReloadNotification.trigger();
    }
  }
}]);
