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
    var suffix = data.path.match(/account\/(.*$)/);
    TheAccountView.silentlyChangeState(suffix && suffix[1]);
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
