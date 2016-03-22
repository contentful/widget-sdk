'use strict';

angular.module('contentful')

.directive('cfWebhookEditor', function () {
  return {
    restrict: 'E',
    template: JST['webhook_editor'](),
    controller: 'WebhookEditorController',
    link: function (scope) {
      if (!scope.context.isNew) {
        scope.tabController.activate('activity');
      }
    }
  };
})

.controller('WebhookEditorController', ['$scope', '$injector', function ($scope, $injector) {

  var $q               = $injector.get('$q');
  var $controller      = $injector.get('$controller');
  var Command          = $injector.get('command');
  var modalDialog      = $injector.get('modalDialog');
  var leaveConfirmator = $injector.get('navigation/confirmLeaveEditor');
  var spaceContext     = $injector.get('spaceContext');
  var webhookRepo      = $injector.get('WebhookRepository').getInstance(spaceContext.space);

  var activityController = $controller('WebhookEditorController/activity', {
    $scope: $scope, repo: webhookRepo
  });

  var settingsController = $controller('WebhookEditorController/settings', {
    $scope: $scope, repo: webhookRepo
  });

  $scope.context.requestLeaveConfirmation = leaveConfirmator(settingsController.save);

  $scope.save = Command.create(settingsController.save, {
    disabled: function () { return !$scope.context.dirty; }
  });

  $scope.openRemovalDialog = Command.create(openRemovalDialog, {
    available: function () { return !$scope.context.isNew; }
  });

  $scope.refreshLogs = Command.create(activityController.refresh);

  function openRemovalDialog() {
    modalDialog.open({
      ignoreEsc: true,
      backgroundClose: false,
      template: 'webhook_removal_confirm_dialog',
      scopeData: {
        webhook: $scope.webhook,
        remove: Command.create(settingsController.remove)
      }
    });

    return $q.resolve();
  }
}])

.controller('WebhookEditorController/settings', ['$scope', 'repo', '$injector', function ($scope, repo, $injector) {

  var $q                 = $injector.get('$q');
  var $state             = $injector.get('$state');
  var notification       = $injector.get('notification');
  var logger             = $injector.get('logger');
  var ReloadNotification = $injector.get('ReloadNotification');

  var touched = getInitialTouchCount();

  this.save = save;
  this.remove = remove;

  $scope.$watch('webhook', function (webhook, prev) {
    touched += 1;
    $scope.context.title = isEmpty('name') ? 'Unnamed' : webhook.name;
    if (webhook === prev) { checkCredentials(); }
  }, true);

  $scope.$watch(function () { return touched; }, function () {
    $scope.context.dirty = touched > 0;
  });

  function save() {
    prepareCredentials();
    return repo.save($scope.webhook).then(handleWebhook, handleError);
  }

  function handleWebhook(webhook) {
    notification.info('Webhook "' + $scope.webhook.name + '" saved successfully.');

    if ($scope.context.isNew) {
      $scope.context.dirty = false;
      return $state.go('spaces.detail.settings.webhooks.detail', {webhookId: webhook.sys.id});
    } else {
      $scope.webhook = webhook;
      checkCredentials();
      touched = getInitialTouchCount();
      return $q.resolve(webhook);
    }
  }

  function handleError(res) {
    var errors = dotty.get(res, 'body.details.errors', []);
    var error = _.isObject(errors[0]) ? errors[0] : {};

    switch (error.path) {
      case 'url':
        handleUrlError(error);
        break;

      case 'http_basic_password':
      case 'http_basic_username':
        notification.error([
          'Please provide a valid user/password combination.',
          'If you don\'t want to use HTTP Basic Authentication, please clear both fields.'
        ].join(' '));
        break;

      default:
        notification.error('Error saving webhook. Please try again.');
        logger.logServerWarn('Error saving webhook.', { errors: errors });
    }

    return $q.reject(error);
  }

  function handleUrlError(error) {
    if (error.name === 'taken') {
      notification.error('This webhook URL is already used.');
    } else {
      notification.error('Please provide a valid webhook URL.');
    }
  }

  function remove() {
    return repo.remove($scope.webhook).then(function () {
      $scope.context.dirty = false;
      notification.info('Webhook "' + $scope.webhook.name + '" deleted successfully.');
      return $state.go('spaces.detail.settings.webhooks.list');
    }, ReloadNotification.basicErrorHandler);
  }

  function checkCredentials() {
    $scope.apiHasAuthCredentials = !isEmpty('httpBasicUsername');
  }

  function prepareCredentials() {
    if (isEmpty('httpBasicUsername')) {
      $scope.webhook.httpBasicUsername = null;
      if (isEmpty('httpBasicPassword')) {
        $scope.webhook.httpBasicPassword = null;
      }
    }
  }

  function isEmpty(prop) {
    var value = dotty.get($scope, ['webhook', prop], null);
    return !_.isString(value) || value.length < 1;
  }

  function getInitialTouchCount() {
    return $scope.context.isNew ? 0 : -1;
  }
}])

.controller('WebhookEditorController/activity', ['$scope', 'repo', function ($scope, repo) {

  var PER_PAGE = 30;
  var items = [];

  this.refresh = refreshActivity;
  $scope.activity = {};
  if (!$scope.context.isNew) { refreshActivity(); }

  $scope.$watch('activity.page', function (page) {
    if (_.isNumber(page) && _.isArray(items)) {
      $scope.activity.visible = items.slice(page*PER_PAGE, (page+1)*PER_PAGE);
    } else {
      $scope.activity.visible = null;
    }
  });

  function refreshActivity() {
    $scope.activity.page = null;
    $scope.activity.loading = fetchActivity();
    return $scope.activity.loading;
  }

  function fetchActivity() {
    return repo.logs.getCalls($scope.webhook.sys.id).then(function (res) {
      items = res.items;
      $scope.activity.pages = _.range(0, Math.ceil(res.items.length / PER_PAGE));
      $scope.activity.loading = false;
      $scope.activity.page = 0;
    });
  }
}]);
