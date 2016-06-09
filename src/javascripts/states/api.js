'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/api
 */
.factory('states/api', ['$injector', function ($injector) {
  var base = $injector.get('states/base');

  var home = {
    name: 'home',
    url: '',
    ncyBreadcrumb: {
      label: 'APIs'
    },
    redirectTo: 'spaces.detail.api.keys.list'
  };

  var contentModel = {
    name: 'content_model',
    url: '/content_model',
    ncyBreadcrumb: {
      label: 'Content model explorer',
      parent: 'spaces.detail.api.home'
    },
    controller: 'apiContentModelController',
    template: JST['api_content_model']()
  };

  var cmaKeys = {
    name: 'cma_keys',
    url: '/cma_keys',
    ncyBreadcrumb: {
      label: 'Content Management API Keys',
      parent: 'spaces.detail.api.home'
    },
    template: JST.api_cma_keys()
  };


  var keyList = base({
    name: 'list',
    url: '/',
    ncyBreadcrumb: {
      label: 'Content Delivery API Keys',
      parent: 'spaces.detail.api.home'
    },
    template: '<cf-api-key-list class="workbench" />',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }]
  });

  var apiKeyEditorState = {
    ncyBreadcrumb: {
      parent: 'spaces.detail.api.keys.list',
      label: '{{context.title + (context.dirty ? "*" : "")}}'
    },
    controller: ['$state', '$scope', '$stateParams', 'apiKey', function ($state, $scope, $stateParams, apiKey) {
      $state.current.data = $scope.context = {};
      $scope.apiKey = apiKey;
    }],
    template: '<cf-api-key-editor class="workbench" />'
  };

  var newKey =  _.extend({
    name: 'new',
    url: '_new',
    resolve: {
      apiKey: ['space', function (space) {
        return space.newDeliveryApiKey();
      }]
    }
  }, apiKeyEditorState);

  var keyDetail = _.extend({
    name: 'detail',
    url: '/:apiKeyId',
    resolve: {
      apiKey: ['$stateParams', 'space', function ($stateParams, space) {
        return space.getDeliveryApiKey($stateParams.apiKeyId);
      }]
    }
  }, apiKeyEditorState);

  var cdaKeys = {
    name: 'keys',
    abstract: true,
    url: '/keys',
    template: '<ui-view/>',
    children: [keyList, newKey, keyDetail]
  };

  return {
    name: 'api',
    url: '/api',
    abstract: true,
    template: '<ui-view/>',
    children: [home, cdaKeys, cmaKeys, contentModel],
    controller: 'ApiKeyController',
    controllerAs: 'apiKeyController'
  };
}]);
