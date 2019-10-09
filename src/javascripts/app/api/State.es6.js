import { assign } from 'lodash';
import contextHistory from 'navigation/Breadcrumbs/History.es6';
import * as crumbFactory from 'navigation/Breadcrumbs/Factory.es6';

import attachEditorController from './KeyEditor/Controller.es6';
import editorTemplate from './KeyEditor/Template.es6';
import * as SpaceEnvironmentRepo from 'data/CMA/SpaceEnvironmentsRepo.es6';
import * as SpaceAliasesRepo from 'data/CMA/SpaceAliasesRepo.es6';
import { redirectReadOnlySpace } from 'states/SpaceSettingsBase.es6';
import { spaceResolver } from 'states/Resolvers.es6';
import ApiKeyListRoute from './ApiKeyList/ApiKeyListRoute';
import CMATokensRoute from './CMATokens/CMATokensRoute';
import { getApiKeyRepo } from 'app/api/services/ApiKeyRepoInstance';

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
    'spaceAliases',
    ($scope, $stateParams, apiKey, spaceEnvironments, spaceAliases) => {
      attachEditorController($scope, apiKey, spaceEnvironments, spaceAliases);

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
      spaceAliases: [
        'spaceContext',
        spaceContext => {
          const repo = SpaceAliasesRepo.create(spaceContext.endpoint);
          return repo.getAll();
        }
      ],
      apiKey: ['$stateParams', $stateParams => getApiKeyRepo().get($stateParams.apiKeyId)]
    }
  },
  apiKeyEditorState
);

export default {
  name: 'api',
  url: '/api',
  abstract: true,
  resolve: {
    space: spaceResolver
  },
  onEnter: [
    'space',
    async space => {
      redirectReadOnlySpace(space);
      getApiKeyRepo().refresh();
    }
  ],
  children: [
    {
      name: 'keys',
      abstract: true,
      url: '/keys',
      children: [
        {
          name: 'list',
          url: '',
          component: ApiKeyListRoute
        },
        keyDetail
      ]
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
      component: CMATokensRoute
    },
    {
      name: 'content_model',
      url: '/content_model',
      redirectTo: 'spaces.detail.content_types.list'
    }
  ]
};
