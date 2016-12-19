'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/api
 */
.factory('states/api', ['require', function (require) {
  var base = require('states/base');
  var contextHistory = require('contextHistory');
  var crumbFactory = require('navigation/CrumbFactory');

  var home = {
    name: 'home',
    url: '',
    redirectTo: 'spaces.detail.api.keys.list'
  };

  var contentModel = {
    name: 'content_model',
    url: '/content_model',
    label: 'Content model explorer',
    controller: 'apiContentModelController',
    template: JST['api_content_model']()
  };

  var cmaKeys = {
    name: 'cma_keys',
    url: '/cma_keys',
    controller: [function () {
      contextHistory.add(crumbFactory.CMAKeyList());
    }],
    template: JST.api_cma_keys()
  };

  var keyList = base({
    name: 'list',
    url: '/',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
      contextHistory.add(crumbFactory.CDAKeyList());
    }],
    template: '<cf-api-key-list class="workbench" />'
  });

  var apiKeyEditorState = {
    params: { addToContext: true },
    controller: ['$scope', 'require', 'apiKey', function ($scope, require, apiKey) {
      var $state = require('$state');
      var $stateParams = require('$stateParams');

      $state.current.data = $scope.context = {};
      $scope.apiKey = apiKey;

      contextHistory.add(crumbFactory.CDAKeyList());
      contextHistory.add(crumbFactory.CDAKey($stateParams.apiKeyId, $scope.context));
    }],
    template: '<cf-api-key-editor class="workbench" />'
  };

  var newKey = _.extend({
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
    children: [keyList, newKey, keyDetail]
  };

  return {
    name: 'api',
    url: '/api',
    abstract: true,
    onEnter: ['spaceContext', function (spaceContext) {
      spaceContext.apiKeys.refresh();
    }],
    children: [home, cdaKeys, cmaKeys, contentModel]
  };
}]);
