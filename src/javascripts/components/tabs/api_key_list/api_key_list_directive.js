'use strict';

angular.module('contentful').directive('cfApiKeyList', function() {
    return {
      template: JST['api_key_list'](),
      restrict: 'A',
      controller: 'ApiKeyListController'
    };
  });
