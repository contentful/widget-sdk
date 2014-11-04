'use strict';

angular.module('contentful').
  directive('apiKeyList', function() {
    return {
      template: JST['api_key_list'](),
      restrict: 'C',
      controller: 'ApiKeyListController'
    };
  });
