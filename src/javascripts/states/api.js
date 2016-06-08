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
    template: '<div cf-api-home class="workbench"></div>'
  };


  var contentModel = {
    name: 'content_model',
    url: '/content_model',
    ncyBreadcrumb: {
      label: 'Content model explorer',
      parent: 'spaces.detail.api.home'
    },
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }],
    template: '<div cf-content-model class="workbench content-model entity-list"></div>'
  };


  var keyList = base({
    name: 'list',
    url: '/',
    ncyBreadcrumb: {
      label: 'Delivery keys',
      parent: 'spaces.detail.api.home'
    },
    loadingText: 'Loading delivery keys...',
    template: '<div cf-api-key-list class="workbench entity-list"></div>',
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
    template:
    '<div cf-api-key-editor ' +
      'class="workbench"' +
    '</div>'
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

  var keys = {
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
    children: [home, contentModel, keys]
  };
}]);
