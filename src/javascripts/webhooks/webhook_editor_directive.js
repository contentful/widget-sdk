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

  function openRemovalDialog () {
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
  var ReloadNotification = $injector.get('ReloadNotification');
  var modalDialog        = $injector.get('modalDialog');
  var validation         = $injector.get('WebhookEditor/validationHelper');

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

  function save () {
    return askAboutHeader().then(function () {
      prepareCredentials();
      var validationError = validation.validate($scope.webhook);
      if (validationError) {
        notification.error(validationError);
        return $q.reject(validationError);
      } else {
        return repo.save($scope.webhook).then(handleWebhook, validation.handleServerError);
      }
    });
  }

  function askAboutHeader () {
    return !$scope.context.headersDirty ? $q.resolve() : modalDialog.open({
      title: 'Check your custom headers',
      message: 'There is an unsaved custom header. You have to click the "Add" button if you want to save it.',
      confirmLabel: 'Continue without adding',
      cancelLabel: 'Cancel'
    }).promise;
  }

  function handleWebhook (webhook) {
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

  function remove () {
    return repo.remove($scope.webhook).then(function () {
      $scope.context.dirty = false;
      notification.info('Webhook "' + $scope.webhook.name + '" deleted successfully.');
      return $state.go('spaces.detail.settings.webhooks.list');
    }, ReloadNotification.basicErrorHandler);
  }

  function checkCredentials () {
    $scope.apiHasAuthCredentials = !isEmpty('httpBasicUsername');
  }

  function prepareCredentials () {
    if (isEmpty('httpBasicUsername')) {
      $scope.webhook.httpBasicUsername = null;
      if (isEmpty('httpBasicPassword')) {
        $scope.webhook.httpBasicPassword = null;
      }
    }
  }

  function isEmpty (prop) {
    var value = dotty.get($scope, ['webhook', prop], null);
    return !_.isString(value) || value.length < 1;
  }

  function getInitialTouchCount () {
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

  function refreshActivity () {
    $scope.activity.page = null;
    $scope.activity.loading = fetchActivity();
    return $scope.activity.loading;
  }

  function fetchActivity () {
    return repo.logs.getCalls($scope.webhook.sys.id).then(function (res) {
      items = res.items;
      $scope.activity.pages = _.range(0, Math.ceil(res.items.length / PER_PAGE));
      $scope.activity.loading = false;
      $scope.activity.page = 0;
    });
  }
}])

.factory('WebhookEditor/validationHelper', ['$injector', function ($injector) {

  var $q           = $injector.get('$q');
  var notification = $injector.get('notification');
  var logger       = $injector.get('logger');
  var urlUtils     = $injector.get('urlUtils');

  var MESSAGES = {
    INVALID_NAME: 'Please provide a valid webhook name.',
    INVALID_TOPICS: 'Please select at least one triggering event type.',
    INVALID_URL: 'Please provide a valid webhook URL.',
    TAKEN_URL: 'This webhook URL is already used.',
    INVALID_CREDENTIALS: [
      'Please provide a valid user/password combination.',
      'If you don\'t want to use HTTP Basic Authentication, please clear both fields.'
    ].join(' '),
    OTHER_ERROR: 'Error saving webhook. Please try again.'
  };

  return {
    validate: validate,
    handleServerError: handleServerError
  };

  function validate (webhook) {
    if (!webhook.name) {
      return MESSAGES.INVALID_NAME;
    }
    if (!_.isArray(webhook.topics) || !webhook.topics.length) {
      return MESSAGES.INVALID_TOPICS;
    }
    if (!webhook.url || !urlUtils.isValid(webhook.url)) {
      return MESSAGES.INVALID_URL;
    }

    return null;
  }

  function handleServerError (res) {
    var errors = dotty.get(res, 'body.details.errors', []);
    var error = _.isObject(errors[0]) ? errors[0] : {};

    switch (error.path) {
      case 'url':
        var key = error.name === 'taken' ? 'TAKEN_URL' : 'INVALID_URL';
        notification.error(MESSAGES[key]);
        break;
      case 'http_basic_password':
      case 'http_basic_username':
        notification.error(MESSAGES.INVALID_CREDENTIALS);
        break;
      default:
        notification.error(MESSAGES.OTHER_ERROR);
        logger.logServerWarn('Error saving webhook.', { errors: errors });
    }

    return $q.reject(error);
  }
}]);
