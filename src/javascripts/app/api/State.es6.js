import { assign } from 'lodash';
import { h } from 'utils/legacy-html-hyperscript';
import baseState from 'states/Base.es6';
import contextHistory from 'navigation/Breadcrumbs/History.es6';
import * as crumbFactory from 'navigation/Breadcrumbs/Factory.es6';
import * as Auth from 'Authentication.es6';

import attachEditorController from './KeyEditor/Controller.es6';
import editorTemplate from './KeyEditor/Template.es6';
import * as CMATokensPage from './CMATokens/Page.es6';
import CMATokensPageTemplate from './CMATokens/PageTemplate.es6';
import * as SpaceEnvironmentRepo from 'data/CMA/SpaceEnvironmentsRepo.es6';
import { redirectReadOnlySpace } from 'states/SpaceSettingsBase.es6';

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
  controller: [
    '$scope',
    '$stateParams',
    'apiKey',
    'spaceEnvironments',
    ($scope, $stateParams, apiKey, spaceEnvironments) => {
      attachEditorController($scope, apiKey, spaceEnvironments);

      contextHistory.set([
        crumbFactory.CDAKeyList(),
        crumbFactory.CDAKey($stateParams.apiKeyId, $scope.context)
      ]);
    }
  ],
  template: editorTemplate()
};

const keyDetail = assign(
  {
    name: 'detail',
    url: '/:apiKeyId',
    resolve: {
      spaceEnvironments: [
        'spaceContext',
        spaceContext => {
          const repo = SpaceEnvironmentRepo.create(spaceContext.endpoint);
          return repo.getAll();
        }
      ],
      apiKey: [
        '$stateParams',
        'spaceContext',
        ($stateParams, spaceContext) => spaceContext.apiKeyRepo.get($stateParams.apiKeyId)
      ]
    }
  },
  apiKeyEditorState
);

const cdaKeyList = baseState({
  name: 'list',
  url: '',
  template: h('cf-api-key-list.workbench')
});

export default {
  name: 'api',
  url: '/api',
  abstract: true,
  onEnter: [
    'spaceContext',
    '$stateParams',
    async (spaceContext, $stateParams) => {
      const spaceId = $stateParams.spaceId;

      await redirectReadOnlySpace(spaceId);
      spaceContext.apiKeyRepo.refresh();
    }
  ],
  children: [
    {
      name: 'keys',
      abstract: true,
      url: '/keys',
      children: [cdaKeyList, keyDetail]
    },
    {
      // Legacy path
      name: 'cma_keys',
      url: '/cma_keys',
      redirectTo: 'spaces.detail.api.cma_tokens'
    },
    {
      name: 'cma_tokens',
      url: '/cma_tokens',
      template: CMATokensPageTemplate(),
      controller: [
        '$scope',
        $scope => {
          CMATokensPage.initController($scope, Auth);
        }
      ]
    },
    {
      name: 'content_model',
      url: '/content_model',
      redirectTo: 'spaces.detail.content_types.list'
    }
  ]
};
