'use strict';

angular.module('contentful')

.factory('handleGatekeeperMessage', ['$injector', function ($injector) {

  var $rootScope         = $injector.get('$rootScope');
  var $location          = $injector.get('$location');
  var authentication     = $injector.get('authentication');
  var notification       = $injector.get('notification');
  var TheAccountView     = $injector.get('TheAccountView');
  var spaceTools         = $injector.get('spaceTools');
  var tokenStore         = $injector.get('tokenStore');
  var ReloadNotification = $injector.get('ReloadNotification');
  var logger = $injector.get('logger');

  return function handleGatekeeperMessage(data) {
    var match = makeMessageMatcher(data);

    if (match('create', 'UserCancellation')) {
      authentication.goodbye();

    } else if (match('new', 'space')) {
      // @todo move it to service
      $rootScope.$broadcast('showCreateSpaceDialog');

    } else if (match('delete', 'space')) {
      spaceTools.leaveCurrent();

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

  function makeMessageMatcher(data) {
    return function matchMessage(action, type) {
      var messageAction = dotty.get(data, 'action', '').toLowerCase();
      var messageType   = dotty.get(data, 'type',   '').toLowerCase();

      return action.toLowerCase() === messageAction && type.toLowerCase() === messageType;
    };
  }

  function showNotification(data) {
    var level = dotty.get(data, 'resource.type', 'info');
    var message = dotty.get(data, 'resource.message');

    if (level.match(/error/)) {
      level = 'warn';
    }

    if (message) {
      notification[level](message);
    }
  }

  function updateState(data) {
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

  function updateToken(data) {
    authentication.updateTokenLookup(data);
    if (authentication.tokenLookup) {
      tokenStore.refreshWithLookup(authentication.tokenLookup);
    } else {
      ReloadNotification.trigger();
    }
  }
}]);
