'use strict';

angular.module('contentful').controller('ApiKeyEditorCtrl', ['$scope', '$injector', function($scope, $injector) {
  var environment = $injector.get('environment');
  var notification = $injector.get('notification');
  var logger = $injector.get('logger');
  var $window = $injector.get('$window');
  var $q = $injector.get('$q');
  $scope.notes = $injector.get('notes');

  var deviceRegexps = {
    iOS: /(iphone os|ipad|iphone)/gi
  };

  var detectedDevice = 'any';

  _.forEach(deviceRegexps, function (re, id) {
    if(re.test($window.navigator.userAgent)){
      detectedDevice = id;
      return false;
    }
  });

  $scope.$watch('tab.params.apiKey', 'apiKey=tab.params.apiKey');

  $scope.tab.closingMessage = 'You have unsaved changes.';
  $scope.tab.closingMessageDisplayType = 'dialog';

  $scope.authCodeExample = {
    lang: 'http',
    api: 'production'
  };

  $scope.getSelectedAccessToken = function () {
    var apiKey = $scope.isPreviewApiSelected() ? $scope.previewApiKey : $scope.apiKey;
    return apiKey.data.accessToken;
  };

  $scope.isPreviewApiSelected = function () {
    return $scope.authCodeExample.api == 'preview';
  };

  $scope.$watch('apiKey.data.name', function(name) {
    $scope.headline = $scope.tab.title = name || 'Untitled';
  });

  $scope.$watch('apiKey.data.accessToken', function(accessToken) {
    $scope.exampleUrl =
      'http://' +
      environment.settings.cdn_host +
      '/spaces/' +
      $scope.spaceContext.space.getId() +
      '/entries?access_token=' +
      accessToken;

    $scope.mobileAppUrl =
      'contentful://open/space/' +
      $scope.spaceContext.space.getId() +
      '?access_token=' +
      accessToken;
  });

  $scope.$watch('apiKey.data.preview_api_key', function (previewApiKey) {
    if(previewApiKey) {
      var id = previewApiKey.sys.id;
      var cb = $q.callback();
      $scope.spaceContext.space.getPreviewApiKey(id, cb);
      cb.promise.then(function (apiKey) {
        $scope.previewApiKey = apiKey;
      });
    }
  });

  $scope.isDevice = function (id) {
    return id === detectedDevice;
  };

  $scope.$watch('apiKeyForm.$dirty', function (modified, old, scope) {
    scope.tab.dirty = modified;
  });

  function title() {
    return '"' + $scope.apiKey.getName() + '"';
  }

  $scope.editable = function() {
    return true;
  };

  $scope['delete'] = function() {
    var t = title();
    $scope.apiKey['delete'](function(err) {
      if (err) {
        notification.warn(t + ' could not be deleted');
        logger.logServerError('ApiKey could not be deleted', err);
        return;
      }
      notification.info(t + ' deleted successfully');
      $scope.broadcastFromSpace('entityDeleted', $scope.apiKey);
    });
  };

  $scope.$on('entityDeleted', function (event, apiKey) {
    if (event.currentScope !== event.targetScope) {
      var scope = event.currentScope;
      if (apiKey === scope.apiKey)
        scope.tab.close();
    }
  });

  $scope.regenerateAccessToken = function (type) {
    // not used, but necessary to trigger digest cycle
    var cb = $q.callback();
    var apiKey = type == 'preview' ? $scope.previewApiKey : $scope.apiKey;
    apiKey.regenerateAccessToken(cb);
  };

  $scope.save = function() {
    var t = title();
    $scope.apiKey.save(function(err) {
      if (err) {
        notification.warn(t + ' could not be saved');
        if(dotty.get(err, 'statusCode') !== 422)
          logger.logServerError('ApiKey could not be saved', err);
        return;
      }
      $scope.apiKeyForm.$setPristine();
      $scope.navigator.apiKeyEditor($scope.apiKey).goTo();
      notification.info(t + ' saved successfully');
    });
  };

}]);
