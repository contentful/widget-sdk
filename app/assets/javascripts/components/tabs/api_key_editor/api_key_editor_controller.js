'use strict';

angular.module('contentful').
  controller('ApiKeyEditorCtrl', function($scope, authentication, environment, notification) {
    $scope.$watch('tab.params.apiKey', 'apiKey=tab.params.apiKey');

    $scope.tab.closingMessage = 'You have unsaved changes.';
    $scope.tab.closingMessageDisplayType = 'dialog';

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
    });

    $scope.$watch('apiKeyForm.$dirty', function (modified, old, scope) {
      scope.tab.dirty = modified;
    });

    function title() {
      return '"' + $scope.apiKey.getName() + '"';
    }

    $scope.editable = function() {
      return true;
    };

    $scope.delete = function() {
      var t = title();
      $scope.apiKey.delete(function(err) {
        $scope.$apply(function() {
          if (err) return notification.error(t + ' could not be deleted');
          notification.info(t + ' deleted successfully');
          $scope.broadcastFromSpace('entityDeleted', $scope.apiKey);
        });
      });
    };

    $scope.$on('entityDeleted', function (event, apiKey) {
      if (event.currentScope !== event.targetScope) {
        var scope = event.currentScope;
        if (apiKey === scope.apiKey)
          scope.tab.close();
      }
    });

    $scope.save = function() {
      var t = title();
      $scope.apiKey.save(function(err) {
        $scope.$apply(function() {
          if (err) return notification.error(t + ' could not be saved');
          $scope.apiKeyForm.$setPristine();
          notification.info(t + ' saved successfully');
        });
      });
    };
  });
