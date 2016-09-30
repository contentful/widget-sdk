'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/api
 */
.factory('states/api', ['require', function (require) {
  var base = require('states/base');
  var contextHistory = require('contextHistory');

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
      contextHistory.addEntity({
        getTitle: _.constant('Content Management API Keys'),
        link: { state: 'spaces.detail.api.cma_keys' },
        getType: _.constant('CMAKeys'),
        getId: _.constant('CMAKEYS')
      });
    }],
    template: JST.api_cma_keys()
  };

  // TODO(mudit): Move entity generation into a factory
  var cdaKeyListEntity = {
    getTitle: _.constant('Content Delivery API Keys'),
    link: { state: 'spaces.detail.api.keys.list' },
    getType: _.constant('CDAKeys'),
    getId: _.constant('CDAKEYS')
  };

  var keyList = base({
    name: 'list',
    url: '/',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
      contextHistory.addEntity(cdaKeyListEntity);
    }],
    template: '<cf-api-key-list class="workbench" />'
  });

  var newKey = _.extend({
    name: 'new',
    url: '_new',
    resolve: {
      apiKey: ['space', function (space) {
        return space.newDeliveryApiKey();
      }]
    }
  }, makeApiKeyEditorState(true));

  var keyDetail = _.extend({
    name: 'detail',
    url: '/:apiKeyId',
    resolve: {
      apiKey: ['$stateParams', 'space', function ($stateParams, space) {
        return space.getDeliveryApiKey($stateParams.apiKeyId);
      }]
    }
  }, makeApiKeyEditorState(false));

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

  function makeApiKeyEditorState (isNew) {
    return {
      params: { addToContext: true },
      controller: ['$scope', 'require', 'apiKey', function ($scope, require, apiKey) {
        var $state = require('$state');
        var $stateParams = require('$stateParams');

        $state.current.data = $scope.context = {};
        $scope.apiKey = apiKey;

        // add cda list as parent
        contextHistory.addEntity(cdaKeyListEntity);

        // add current state
        var crumb = createApiKeyCrumb($scope.context, $stateParams.apiKeyId, isNew);
        contextHistory.addEntity(crumb);
      }],
      template: '<cf-api-key-editor class="workbench" />'
    };
  }

  function createApiKeyCrumb (context, apiKeyId, isNew) {
    var id = isNew ? 'CDAKEYNEW' : apiKeyId;
    var stateFragment = isNew ? 'new' : 'detail';
    var params = isNew ? undefined : { apiKeyId: apiKeyId };

    return {
      getTitle: function getTitle () {
        return context.title + (context.dirty ? '*' : '');
      },
      link: {
        state: 'spaces.detail.api.keys.' + stateFragment,
        params: params
      },
      getType: _.constant('CDAKey'),
      getId: _.constant(id)
    };
  }
}]);
