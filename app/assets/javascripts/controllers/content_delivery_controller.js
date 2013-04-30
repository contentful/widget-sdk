'use strict';

angular.module('contentful/controllers').
  controller('ContentDeliveryCtrl', function($scope, $window, environment) {
    $scope.refreshApiKeys = function() {
      $scope.bucketContext.bucket.getApiKeys(null, function(err, apiKeys) {
        $scope.$apply(function() {
          $scope.apiKeys = apiKeys;
        });
      });
    };

    $scope.$watch('apiKeys', function(apiKeys) {
      $scope.empty = _.isEmpty(apiKeys);
    });

    $scope.$on('entityDeleted', function (event, entity) {
      var scope = event.currentScope;
      var index = _.indexOf(scope.apiKeys, entity);
      if (index > -1) {
        scope.apiKeys.splice(index, 1);
      }
    });

    $scope.refreshApiKeys();

    $scope.$on('tabBecameActive', function(event, tab) {
      if (tab !== $scope.tab) return;
      $scope.refreshApiKeys();
    });

    $scope.editApiKey = function(apiKey) {
      var editor = _.find($scope.tab.list.items, function(tab){
        return (tab.viewType == 'api-key-editor' &&
                tab.params.apiKey.getId() == apiKey.getId());
      });
      if (!editor) {
        editor = $scope.tab.list.add({
          viewType: 'api-key-editor',
          section: 'contentDelivery',
          params: {
            apiKey: apiKey,
            mode: 'edit'
          }
        });
      }
      editor.activate();
    };

    $scope.openApiDocs = function() {
      var apiDocsUrl = '//' + environment.settings.marketing_url + '/developers/api';
      $window.open(apiDocsUrl);
    };
  });
