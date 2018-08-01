'use strict';

angular.module('contentful')

.directive('cfWebhookEditor', () => ({
  restrict: 'E',
  template: JST['webhook_editor'](),
  controller: 'WebhookEditorController',
  link: function (scope) {
    if (!scope.context.isNew) {
      scope.tabController.activate('activity');
    }
  }
}))

.controller('WebhookEditorController', ['$scope', 'require', ($scope, require) => {
  const $q = require('$q');
  const $state = require('$state');
  const notification = require('notification');
  const ReloadNotification = require('ReloadNotification');
  const spaceContext = require('spaceContext');
  const Command = require('command');
  const modalDialog = require('modalDialog');
  const leaveConfirmator = require('navigation/confirmLeaveEditor');

  const INVALID_BODY_TRANSFORMATION_ERROR_MSG = 'Please make sure your custom payload is a valid JSON.';
  const HTTP_BASIC_ERROR_MSG = 'Please provide a valid username/password combination.';
  const CONFLICT_ERROR_MSG = 'Can only save the most recent version. Please refresh the page and try again.';
  const UNKNOWN_ERROR_MSG = 'An error occurred while saving your webhook. Please try again.';

  const PATH_TO_ERROR_MSG = {
    name: 'Please provide a valid webhook name.',
    url: 'Please provide a valid webhook URL.',
    topics: 'Please select at least one triggering event type.',
    filters: 'Please make sure all filters are valid or remove incomplete ones.',
    headers: 'Please make sure all headers are valid or remove incomplete ones.',
    http_basic_username: HTTP_BASIC_ERROR_MSG,
    http_basic_password: HTTP_BASIC_ERROR_MSG
  };

  $scope.context.dirty = $scope.context.isNew;
  $scope.context.requestLeaveConfirmation = leaveConfirmator(save);

  $scope.refreshLog = Command.create(() => Promise.resolve());
  $scope.activityProps = {
    webhookId: _.get($scope.webhook, ['sys', 'id']),
    webhookRepo: spaceContext.webhookRepo,
    registerActivityLogFetch: fn => {
      $scope.refreshLog = Command.create(fn);
      $scope.$applyAsync();
    }
  };

  // Hack: we want to rerender the component every time
  // the tab is changed so children requiring DOM sizes
  // can lay themselves out properly. CodeMirror is a good
  // example.
  // TODO: do tabs with React
  $scope.$watch(
    () => $scope.tabController.getActiveTabName(),
    activeTab => { $scope.props.activeTab = activeTab; }
  );

  updatePropsFromScope();
  updateContextName();

  $scope.save = Command.create(save, {
    disabled: function () { return !$scope.context.dirty; }
  });

  $scope.openRemovalDialog = Command.create(openRemovalDialog, {
    available: function () { return !$scope.context.isNew; }
  });

  function openRemovalDialog () {
    modalDialog.open({
      ignoreEsc: true,
      backgroundClose: false,
      template: 'webhook_removal_confirm_dialog',
      scopeData: {
        webhook: $scope.webhook,
        remove: Command.create(remove)
      }
    });

    return $q.resolve();
  }

  function updatePropsFromScope () {
    const cloned = _.cloneDeep($scope.webhook);
    const withoutSys = _.omit(cloned, ['sys']);

    $scope.props = {
      webhook: withoutSys,
      hasHttpBasicStored: hasHttpBasic($scope.webhook),
      onChange
    };
  }

  function onChange (changedWebhook) {
    Object.assign($scope.webhook, changedWebhook);
    if (!hasHttpBasic($scope.webhook)) {
      $scope.props.hasHttpBasicStored = false;
    }

    $scope.context.dirty = true;
    updateContextName();
    $scope.$applyAsync();
  }

  function hasHttpBasic (webhook) {
    return typeof webhook.httpBasicUsername === 'string';
  }

  function updateContextName () {
    const {name} = $scope.webhook;
    const named = typeof name === 'string' && name.length > 0;
    $scope.context.title = named ? name : 'Unnamed';
  }

  function save () {
    if (!spaceContext.webhookRepo.hasValidBodyTransformation($scope.webhook)) {
      notification.error(INVALID_BODY_TRANSFORMATION_ERROR_MSG);
      return;
    }

    return spaceContext.webhookRepo.save($scope.webhook).then(webhook => {
      $scope.context.dirty = false;
      notification.info('Webhook "' + $scope.webhook.name + '" saved successfully.');

      if ($scope.context.isNew) {
        return $state.go('^.detail', {webhookId: webhook.sys.id});
      } else {
        // `$scope.webhook` is resolved with Angular UI Router.
        // We want to reuse the scope reference for storing the saved
        // webhook so consecutive requests of resolved data result in
        // the latest state, not the originally resolved object.
        Object.keys($scope.webhook).forEach(k => { delete $scope.webhook[k]; });
        Object.assign($scope.webhook, webhook);

        updatePropsFromScope();
        updateContextName();
        return $q.resolve(webhook);
      }
    }, err => {
      if (_.get(err, ['body', 'sys', 'id']) === 'Conflict') {
        notification.error(CONFLICT_ERROR_MSG);
        return $q.reject(err);
      }

      const [apiError] = _.get(err, ['body', 'details', 'errors'], []);
      const message = apiError && PATH_TO_ERROR_MSG[apiError.path];
      notification.error(message || UNKNOWN_ERROR_MSG);
      return $q.reject(err);
    });
  }

  function remove () {
    return spaceContext.webhookRepo.remove($scope.webhook).then(() => {
      $scope.context.dirty = false;
      notification.info('Webhook "' + $scope.webhook.name + '" deleted successfully.');
      return $state.go('^.list');
    }, ReloadNotification.basicErrorHandler);
  }
}]);
