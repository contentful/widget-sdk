'use strict';

angular.module('contentful').controller('ApiKeyEditorController', ['$scope', '$injector', function($scope, $injector) {
  var controller  = this;
  var environment = $injector.get('environment');
  var notifier    = $injector.get('apiKeyEditor/notifications');
  var $window     = $injector.get('$window');
  var $rootScope  = $injector.get('$rootScope');
  var Command     = $injector.get('command');
  var truncate    = $injector.get('stringUtils').truncate;

  var IOS_RE = /(iphone os|ipad|iphone)/gi;
  $scope.isIos = IOS_RE.test($window.navigator.userAgent);

  var notify = notifier(function getTitle () {
    return truncate($scope.apiKey.getName(), 50);
  });

  $scope.context.closingMessage = [
    'You edited the Api Key but didn\'t save your changes.',
    'Please either save or discard them'
  ];

  $scope.environment = environment;

  $scope.authCodeExample = {
    lang: 'http',
    api: 'cda'
  };

  $scope.getSelectedAccessToken = function () {
    var apiKey = isPreviewApiSelected() ? $scope.previewApiKey : $scope.apiKey;
    return apiKey.data.accessToken;
  };

  $scope.getApiUrl = function () {
    return environment.settings.cdn_host.replace('cdn', isPreviewApiSelected() ? 'preview': 'cdn');
  };

  $scope.$watch('apiKey.data.accessToken', function(accessToken) {
    $scope.exampleUrl =
      'http://' +
      environment.settings.cdn_host +
      '/spaces/' +
      $scope.spaceContext.space.getId() +
      '/entries?access_token=' +
      accessToken;

    $scope.iosMobileAppUrl =
      'contentful://open/space/' +
      $scope.spaceContext.space.getId() +
      '?access_token=' +
      accessToken;

    if ($scope.apiKey.getId() && !dotty.exists($scope, 'apiKey.data.preview_api_key')) {
      generatePreviewApiKey();
    }
  });

  $scope.$watch('apiKey.data.preview_api_key', function (previewApiKey) {
    if(previewApiKey) {
      var id = previewApiKey.sys.id;
      $scope.spaceContext.space.getPreviewApiKey(id)
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

  $scope.editable = function() {
    return true;
  };

  $scope.delete = function() {
    $scope.apiKey.delete()
    .then(function(){
      notify.deleteSuccess();
      $rootScope.$broadcast('entityDeleted', $scope.apiKey);
    }, notify.deleteFail);
  };

  $scope.$on('entityDeleted', function (event, apiKey) {
    if (event.currentScope !== event.targetScope) {
      var scope = event.currentScope;
      if (apiKey === scope.apiKey) {
        $scope.context.dirty = false;
        scope.closeState();
      }
    }
  });

  $scope.regenerateAccessToken = function (type) {
    // not used, but necessary to trigger digest cycle
    var apiKey = type == 'preview' ? $scope.previewApiKey : $scope.apiKey;
    apiKey.regenerateAccessToken();
  };

  controller.save = Command.create(save, {
    disabled: function () {
      return $scope.apiKeyForm.$invalid ||
             $scope.permissionController.get('createApiKey', 'shouldDisable');
    }
  });

  function save () {
    return $scope.apiKey.save()
    .then(function(){
      $scope.apiKeyForm.$setPristine();
      $scope.context.dirty = false;
      $scope.$state.go('spaces.detail.api.keys.detail', { apiKeyId: $scope.apiKey.getId() })
      .finally(notify.saveSuccess);
    })
    .catch(notify.saveFail);
  }


  function generatePreviewApiKey() {
    var data = _.omit($scope.apiKey.data, 'sys', 'preview_api_key', 'accessToken', 'policies');
    data.apiKeyId = $scope.apiKey.getId();
    $scope.spaceContext.space.createPreviewApiKey(data)
    .then(function (previewApiKey) {
      $scope.previewApiKey = previewApiKey;
    });
  }

  function isPreviewApiSelected() {
    return $scope.authCodeExample.api == 'preview';
  }

}])

.factory('apiKeyEditor/notifications', ['$injector', function ($injector) {
  var logger       = $injector.get('logger');
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
          logger.logServerWarn('ApiKey could not be saved', {error: error });
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
