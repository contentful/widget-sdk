'use strict';

angular.module('contentful')

.factory('handleGatekeeperMessage', ['require', require => {
  const $location = require('$location');
  const Authentication = require('Authentication');
  const notification = require('notification');
  const TokenStore = require('services/TokenStore');
  const CreateSpace = require('services/CreateSpace');
  const UrlSyncHelper = require('account/UrlSyncHelper');
  const modalDialog = require('modalDialog');
  const $state = require('$state');

  return function handleGatekeeperMessage (data) {
    const match = makeMessageMatcher(data);

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
      const messageAction = _.get(data, 'action', '').toLowerCase();
      const messageType = _.get(data, 'type', '').toLowerCase();

      return action.toLowerCase() === messageAction && type.toLowerCase() === messageType;
    };
  }

  function showErrorModal (data) {
    const defaultTitle = 'Something went wrong';
    const defaultMessage = 'An error has occurred. We have been automatically notified and will investigate. If it re-occurs, please contact support.';

    modalDialog.open({
      title: _.unescape(data.heading) || defaultTitle,
      message: _.unescape(data.body) || defaultMessage,
      ignoreEsc: true,
      backgroundClose: false
    }).promise
    .then(() => {
      $state.go('home');
    });
  }

  function showNotification (data) {
    let level = _.get(data, 'resource.type', 'info');
    const message = _.get(data, 'resource.message');

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
