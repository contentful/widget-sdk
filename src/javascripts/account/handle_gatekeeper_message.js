'use strict';

angular.module('contentful')

.factory('handleGatekeeperMessage', ['require', function (require) {
  var $location = require('$location');
  var authentication = require('Authentication');
  var notification = require('notification');
  var tokenStore = require('services/TokenStore');
  var CreateSpace = require('services/CreateSpace');
  var UrlSyncHelper = require('account/UrlSyncHelper');
  var modalDialog = require('modalDialog');
  var logger = require('logger');
  var $state = require('$state');

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

    } else if (matchesError(data)) {
      showErrorModal(data);
    } else { tokenStore.refresh(); }
  };

  function matchesError (data) {
    return data.type === 'error' && /^(4|5)[0-9]{2}$/.test(data.status);
  }

  function makeMessageMatcher (data) {
    return function matchMessage (action, type) {
      var messageAction = dotty.get(data, 'action', '').toLowerCase();
      var messageType = dotty.get(data, 'type', '').toLowerCase();

      return action.toLowerCase() === messageAction && type.toLowerCase() === messageType;
    };
  }

  function showErrorModal (data) {
    var defaultTitle = 'Something went wrong';
    var defaultMessage = 'An error has occurred. We have been automatically notified and will investigate. If it re-occurs, please contact support.';

    modalDialog.open({
      title: data.heading || defaultTitle,
      message: data.body || defaultMessage,
      ignoreEsc: true,
      backgroundClose: false
    }).promise
    .then(function () {
      $state.go('home');
    });

    logger.logError('Gatekeeper error occurred', data);
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
