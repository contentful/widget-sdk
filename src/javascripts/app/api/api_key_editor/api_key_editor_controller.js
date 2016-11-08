'use strict';

angular.module('contentful')
.controller('ApiKeyEditorController', ['$scope', '$injector', function ($scope, $injector) {
  var controller = this;
  var notifier = $injector.get('apiKeyEditor/notifications');
  var Command = $injector.get('command');
  var truncate = $injector.get('stringUtils').truncate;
  var leaveConfirmator = $injector.get('navigation/confirmLeaveEditor');
  var spaceContext = $injector.get('spaceContext');
  var $state = $injector.get('$state');
  var accessChecker = $injector.get('accessChecker');
  var closeState = $injector.get('navigation/closeState');
  var sdkInfoSupplier = $injector.get('sdkInfoSupplier');
  var analytics = $injector.get('analytics');

  var notify = notifier(function getTitle () {
    return truncate($scope.apiKey.getName(), 50);
  });

  $scope.context.requestLeaveConfirmation = leaveConfirmator(save);

  $scope.isReadOnly = function () { return !accessChecker.canModifyApiKeys(); };

  $scope.getSpaceId = function () {
    return spaceContext.getId();
  };

  $scope.canAccessUsers = accessChecker.getSectionVisibility().settings;

  $scope.$watch('apiKey.data.accessToken', function () {
    if ($scope.apiKey.getId() && !dotty.exists($scope, 'apiKey.data.preview_api_key')) {
      generatePreviewApiKey();
    }
  });

  $scope.$watch('apiKey.data.preview_api_key', function (previewApiKey) {
    if (previewApiKey) {
      var id = previewApiKey.sys.id;
      spaceContext.space.getPreviewApiKey(id)
      .then(function (apiKey) {
        $scope.previewApiKey = apiKey;
      });
    }
  });

  $scope.$watch('apiKeyForm.$dirty', function (modified) {
    $scope.context.dirty = modified;
  });

  $scope.$watch('apiKey.data.name', function (title) {
    $scope.context.title = title || 'New Api Key';
  });

  $scope.delete = function () {
    $scope.apiKey.delete()
    .then(function () {
      notify.deleteSuccess();
      spaceContext.apiKeys.refresh();
      return closeState();
    }, notify.deleteFail);
  };

  $scope.regenerateAccessToken = function (type) {
    // not used, but necessary to trigger digest cycle
    var apiKey = type === 'preview' ? $scope.previewApiKey : $scope.apiKey;
    apiKey.regenerateAccessToken();
  };

  var documentationList = ['documentation', 'gettingStarted', 'deliveryApi'];

  $scope.languages = sdkInfoSupplier.get(documentationList);

  $scope.selectLanguage = function (language) {
    if ($scope.selectedLanguage === language) {
      $scope.selectedLanguage = undefined;
    } else {
      $scope.selectedLanguage = language;
      analytics.track('api_keys:language_selected', {
        language: $scope.selectedLanguage.name
      });
    }
  };

  controller.save = Command.create(save, {
    disabled: function () {
      return $scope.apiKeyForm.$invalid || accessChecker.shouldDisable('createApiKey');
    },
    available: function () {
      return !$scope.isReadOnly();
    }
  });

  function save () {
    return $scope.apiKey.save()
    .then(function () {
      // The form might already have been destroyed. This happens when
      // navigating away before the save is successfull
      if ($scope.apiKeyForm) {
        $scope.apiKeyForm.$setPristine();
      }
      $scope.context.dirty = false;

      spaceContext.apiKeys.refresh();
      $state.go('spaces.detail.api.keys.detail', { apiKeyId: $scope.apiKey.getId() })
      .finally(notify.saveSuccess);
    })
    .catch(notify.saveFail);
  }


  function generatePreviewApiKey () {
    var data = _.omit($scope.apiKey.data, 'sys', 'preview_api_key', 'accessToken', 'policies');
    data.apiKeyId = $scope.apiKey.getId();
    spaceContext.space.createPreviewApiKey(data)
    .then(function (previewApiKey) {
      $scope.previewApiKey = previewApiKey;
    });
  }
}])

.factory('apiKeyEditor/notifications', ['$injector', function ($injector) {
  var logger = $injector.get('logger');
  var notification = $injector.get('notification');

  return function (getTitle) {
    return {
      saveSuccess: function () {
        notification.info('“' + getTitle() + '” saved successfully');
      },

      saveFail: function (error) {
        notification.error('“' + getTitle() + '” could not be saved');
        // HTTP 422: Unprocessable entity
        if (dotty.get(error, 'statusCode') !== 422) {
          logger.logServerWarn('ApiKey could not be saved', {error: error});
        }
      },

      deleteSuccess: function () {
        notification.info('“' + getTitle() + '” deleted successfully');
      },

      deleteFail: function (error) {
        notification.error('“' + getTitle() + '” could not be deleted');
        logger.logServerWarn('ApiKey could not be deleted', {error: error});
      }
    };
  };
}]);
