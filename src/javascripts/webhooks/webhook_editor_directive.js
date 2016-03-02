'use strict';

angular.module('contentful')

.directive('cfWebhookEditor', function () {
  return {
    restrict: 'E',
    template: JST['webhook_editor'](),
    controller: 'WebhookEditorController'
  };
})

.controller('WebhookEditorController', ['$scope', '$injector', function ($scope, $injector) {

  var $q                 = $injector.get('$q');
  var Command            = $injector.get('command');
  var $state             = $injector.get('$state');
  var modalDialog        = $injector.get('modalDialog');
  var leaveConfirmator   = $injector.get('navigation/confirmLeaveEditor');
  var spaceContext       = $injector.get('spaceContext');
  var space              = spaceContext.space;
  var webhookRepo        = $injector.get('WebhookRepository').getInstance(space);
  var notification       = $injector.get('notification');
  var logger             = $injector.get('logger');
  var ReloadNotification = $injector.get('ReloadNotification');

  var PER_PAGE = 30;

  var touched = getInitialTouchCount();

  $scope.context.requestLeaveConfirmation = leaveConfirmator(save);
  $scope.activity = {loading: false};

  $scope.$watch('webhook', function (webhook, prev) {
    touched += 1;
    $scope.context.title = isEmpty('url') ? 'Unspecified' : webhook.url;
    if (webhook === prev) { checkCredentials(); }
  }, true);

  $scope.$watch(function () { return touched; }, function () {
    $scope.context.dirty = touched > 0;
  });

  $scope.$watch('context.isNew', function (isNew) {
    if (!isNew && !$scope.activity.items && !$scope.activity.loading) {
      $scope.activity.loading = fetchActivity();
    }
  });

  $scope.$watch('activity.page', function (page) {
    if (_.isNumber(page) && $scope.activity.items) {
      $scope.activity.visible = $scope.activity.items.slice(page*PER_PAGE, (page+1)*PER_PAGE);
    }
  });

  $scope.save = Command.create(save, {
    disabled: function () { return !$scope.context.dirty; }
  });

  $scope.openRemovalDialog = Command.create(openRemovalDialog, {
    available: function () { return !$scope.context.isNew; }
  });

  function save() {
    prepareCredentials();
    return webhookRepo.save($scope.webhook).then(handleWebhook, handleError);
  }

  function handleWebhook(webhook) {
    notification.info('Webhook calling ' + $scope.webhook.url + ' saved successfully.');

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

  function openRemovalDialog() {
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

  function remove() {
    return webhookRepo.remove($scope.webhook).then(function () {
      $scope.context.dirty = false;
      notification.info('Webhook calling ' + $scope.webhook.url + ' deleted successfully.');
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

  function fetchActivity() {
    return space.endpoint('webhooks/' + $scope.webhook.sys.id + '/calls').get().then(function (res) {
      $scope.activity.items = res.items;
      $scope.activity.pages = _.range(0, Math.ceil(res.items.length / PER_PAGE));
      $scope.activity.loading = false;
      $scope.activity.page = 0;
    });
  }
}]);
