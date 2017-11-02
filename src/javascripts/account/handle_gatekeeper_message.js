'use strict';

angular.module('contentful')

.factory('handleGatekeeperMessage', ['require', function (require) {
  var $location = require('$location');
  var Authentication = require('Authentication');
  var notification = require('notification');
  var TokenStore = require('services/TokenStore');
  var CreateSpace = require('services/CreateSpace');
  var UrlSyncHelper = require('account/UrlSyncHelper');
  var modalDialog = require('modalDialog');
  var $state = require('$state');

  return function handleGatekeeperMessage (data) {
    var match = makeMessageMatcher(data);

    if (match('create', 'UserCancellation')) {
      Authentication.cancelUser();

    } else if (match('new', 'space')) {
      CreateSpace.showDialog(data.organizationId);

    } else if (match('delete', 'space')) {
      TokenStore.refresh();

    } else if (data.type === 'flash') {
      showNotification(data);

    } else if (match('navigate', 'location')) {
      $location.url(data.path);

    } else if (match('update', 'location')) {
      UrlSyncHelper.updateWebappUrl(data.path);

    } else if (matchesError(data, 401)) {
      Authentication.redirectToLogin();

    } else if (matchesError(data)) {
      showErrorModal(data);
    } else { TokenStore.refresh(); }
  };

  function matchesError (data, errorCode) {
    if (data.type !== 'error') {
      return false;
    }

    if (errorCode) {
      return data.status === errorCode;
    } else {
      return /^(4|5)[0-9]{2}$/.test(data.status);
    }
  }

  function makeMessageMatcher (data) {
    return function matchMessage (action, type) {
      var messageAction = _.get(data, 'action', '').toLowerCase();
      var messageType = _.get(data, 'type', '').toLowerCase();

      return action.toLowerCase() === messageAction && type.toLowerCase() === messageType;
    };
  }

  function showErrorModal (data) {
    var defaultTitle = 'Something went wrong';
    var defaultMessage = 'An error has occurred. We have been automatically notified and will investigate. If it re-occurs, please contact support.';

    modalDialog.open({
      title: _.unescape(data.heading) || defaultTitle,
      message: _.unescape(data.body) || defaultMessage,
      ignoreEsc: true,
      backgroundClose: false
    }).promise
    .then(function () {
      $state.go('home');
    });
  }

  function showNotification (data) {
    var level = _.get(data, 'resource.type', 'info');
    var message = _.get(data, 'resource.message');

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
