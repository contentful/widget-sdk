'use strict';

angular.module('contentful')

.factory('handleGatekeeperMessage', ['require', function (require) {
  var $location = require('$location');
  var $state = require('$state');
  var authentication = require('Authentication');
  var notification = require('notification');
  var tokenStore = require('tokenStore');
  var CreateSpace = require('services/CreateSpace');

  return function handleGatekeeperMessage (data) {
    var match = makeMessageMatcher(data);

    if (match('create', 'UserCancellation')) {
      authentication.cancelUser();

    } else if (match('new', 'space')) {
      CreateSpace.showDialog(data.organizationId);

    } else if (match('delete', 'space')) {
      tokenStore.refresh();
      $state.go('home');

    } else if (data.type === 'flash') {
      showNotification(data);

    } else if (match('navigate', 'location') && data.path) {
      $location.url(data.path);

    } else if (match('update', 'location') && data.path) {
      updateUrl(data.path);

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

  // If the state is the same as the current one (except for path suffix), silently
  // update the URL. Otherwise, update the location triggering a state change.
  function updateUrl (target) {
    var base = $state.href($state.current.name);
    // decode forward slashes and remove trailing slash
    var baseDecoded = decodeURIComponent(base).replace(/\/$/, '');
    var isCurrentState = _.startsWith(target, baseDecoded) || _.startsWith(baseDecoded, target);

    if (isCurrentState) {
      var pathSuffix = target.replace(baseDecoded, '');
      var params = _.extend($state.params, {pathSuffix: pathSuffix});
      $state.go($state.current, params, {location: 'replace'});
    } else {
      $location.url(target);
    }
  }
}]);
