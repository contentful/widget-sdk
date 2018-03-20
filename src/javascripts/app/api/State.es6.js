import {assign} from 'lodash';
import {h} from 'utils/hyperscript';
import baseState from 'states/Base';
import contextHistory from 'navigation/Breadcrumbs/History';
import * as crumbFactory from 'navigation/Breadcrumbs/Factory';
import * as Auth from 'Authentication';

import attachEditorController from './KeyEditor/Controller';
import editorTemplate from './KeyEditor/Template';
import * as CMATokensPage from './CMATokens/Page';
import * as SpaceEnvironmentRepo from 'data/CMA/SpaceEnvironmentsRepo';


/**
 * @ngdoc service
 * @name app/api/State
 * This module export the API section state.
 *
 * It consists of
 * - /api/keys            The CDA key list
 * - /api/keys/:apiKeyId  The CDA key editor for a key
 * - /api/cma_keys        The CMA key section
 * - /api/content_model   Redirection for the legacy content model explorer
 */


// These properties are common to the key editor state for new and
// existing keys.
const apiKeyEditorState = {
  controller: ['$scope', '$stateParams', 'apiKey', 'spaceEnvironments', function ($scope, $stateParams, apiKey, spaceEnvironments) {
    attachEditorController($scope, apiKey, spaceEnvironments);

    contextHistory.set([
      crumbFactory.CDAKeyList(),
      crumbFactory.CDAKey($stateParams.apiKeyId, $scope.context)
    ]);
  }],
  template: editorTemplate()
};

const keyDetail = assign({
  name: 'detail',
  url: '/:apiKeyId',
  resolve: {
    spaceEnvironments: ['spaceContext', function (spaceContext) {
      const repo = SpaceEnvironmentRepo.create(spaceContext.endpoint);
      return repo.getAll();
    }],
    apiKey: ['$stateParams', 'spaceContext', function ($stateParams, spaceContext) {
      return spaceContext.apiKeyRepo.get($stateParams.apiKeyId);
    }]
  }
}, apiKeyEditorState);

const cdaKeyList = baseState({
  name: 'list',
  url: '',
  template: h('cf-api-key-list.workbench')
});

export default {
  name: 'api',
  url: '/api',
  abstract: true,
  onEnter: ['spaceContext', function (spaceContext) {
    spaceContext.apiKeyRepo.refresh();
  }],
  children: [{
    name: 'keys',
    abstract: true,
    url: '/keys',
    children: [cdaKeyList, keyDetail]
  }, {
    // Legacy path
    name: 'cma_keys',
    url: '/cma_keys',
    redirectTo: 'spaces.detail.api.cma_tokens'
  }, {
    name: 'cma_tokens',
    url: '/cma_tokens',
    template: CMATokensPage.template(),
    controller: ['$scope', ($scope) => {
      CMATokensPage.initController($scope, Auth);
    }]
  }, {
    name: 'content_model',
    url: '/content_model',
    redirectTo: 'spaces.detail.content_types.list'
  }]
};
