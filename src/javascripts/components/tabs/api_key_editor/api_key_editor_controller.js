'use strict';

angular.module('contentful').controller('ApiKeyEditorController', ['$scope', '$injector', function($scope, $injector) {
  var environment = $injector.get('environment');
  var notification = $injector.get('notification');
  var logger = $injector.get('logger');
  var $window = $injector.get('$window');
  var $rootScope = $injector.get('$rootScope');
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

    $scope.mobileAppUrl =
      'contentful://open/space/' +
      $scope.spaceContext.space.getId() +
      '?access_token=' +
      accessToken;

    if($scope.apiKey.getId() && !dotty.exists($scope, 'apiKey.data.preview_api_key')) generatePreviewApiKey();
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

  $scope.isDevice = function (id) {
    return id === detectedDevice;
  };

  $scope.$watch('apiKeyForm.$dirty', function (modified) {
    $scope.context.dirty = modified;
  });

  $scope.$watch('apiKey.data.name', function (title) {
    $scope.context.title = title || 'New Api Key';
  });

  function title() {
    return '"' + $scope.apiKey.getName() + '"';
  }

  $scope.editable = function() {
    return true;
  };

  $scope.delete = function() {
    var t = title();
    $scope.apiKey.delete()
    .then(function(){
      notification.info(t + ' deleted successfully');
      $rootScope.$broadcast('entityDeleted', $scope.apiKey);
    })
    .catch(function(err){
      notification.warn(t + ' could not be deleted');
      logger.logServerWarn('ApiKey could not be deleted', {error: err});
    });
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

  $scope.save = function() {
    var t = title();
    $scope.apiKey.save()
    .then(function(){
      $scope.apiKeyForm.$setPristine();
      $scope.context.dirty = false;
      $scope.$state.go('spaces.detail.api.keys.detail', { apiKeyId: $scope.apiKey.getId() });
      notification.info(t + ' saved successfully');
    })
    .catch(function(err){
      notification.warn(t + ' could not be saved');
      if(dotty.get(err, 'statusCode') !== 422)
        logger.logServerWarn('ApiKey could not be saved', {error: err });
    });
  };

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



}]);
