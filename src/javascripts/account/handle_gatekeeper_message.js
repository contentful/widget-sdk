'use strict';

angular.module('contentful')

.factory('handleGatekeeperMessage', ['require', function (require) {
  var $location = require('$location');
  var authentication = require('Authentication');
  var notification = require('notification');
  var tokenStore = require('services/TokenStore');
  var CreateSpace = require('services/CreateSpace');
  var UrlSyncHelper = require('account/UrlSyncHelper');

  return function handleGatekeeperMessage (data) {
    var match = makeMessageMatcher(data);

    if (match('create', 'UserCancellation')) {
      authentication.cancelUser();

    } else if (match('new', 'space')) {
      CreateSpace.showDialog(data.organizationId);

    } else if (match('delete', 'space')) {
      tokenStore.refresh();

    } else if (data.type === 'flash') {
      showNotification(data);

    } else if (match('navigate', 'location')) {
      $location.url(data.path);

    } else if (match('update', 'location')) {
      UrlSyncHelper.updateWebappUrl(data.path);

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
}]);
