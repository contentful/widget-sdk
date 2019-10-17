import * as SpaceEnvironmentRepo from 'data/CMA/SpaceEnvironmentsRepo.es6';
import * as SpaceAliasesRepo from 'data/CMA/SpaceAliasesRepo.es6';
import { redirectReadOnlySpace } from 'states/SpaceSettingsBase.es6';
import { spaceResolver } from 'states/Resolvers.es6';
import ApiKeyListRoute from '../ApiKeyList/ApiKeyListRoute';
import CMATokensRoute from '../CMATokens/CMATokensRoute';
import KeyEditorRoute from '../KeyEditor/KeyEditorRoute';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog.es6';

/**
 * This module export the API section state.
 *
 * It consists of
 * - /api/keys            The CDA key list
 * - /api/keys/:apiKeyId  The CDA key editor for a key
 * - /api/cma_keys        The CMA key section
 * - /api/content_model   Redirection for the legacy content model explorer
 */

export default {
  name: 'api',
  url: '/api',
  abstract: true,
  resolve: {
    space: spaceResolver
  },
  onEnter: [
    'space',
    space => {
      redirectReadOnlySpace(space);
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
        {
          name: 'detail',
          url: '/:apiKeyId',
          component: KeyEditorRoute,
          mapInjectedToProps: [
            '$scope',
            '$stateParams',
            'spaceContext',
            ($scope, $stateParams, spaceContext) => ({
              spaceEnvironmentsRepo: SpaceEnvironmentRepo.create(spaceContext.endpoint),
              spaceAliasesRepo: SpaceAliasesRepo.create(spaceContext.endpoint),
              apiKeyId: $stateParams.apiKeyId,
              spaceId: spaceContext.getId(),
              isAdmin: !!spaceContext.getData(['spaceMember', 'admin']),
              registerSaveAction: save => {
                $scope.context.requestLeaveConfirmation = createUnsavedChangesDialogOpener(save);
                $scope.$applyAsync();
              },
              setDirty: value => {
                $scope.context.dirty = value;
                $scope.$applyAsync();
              }
            })
          ]
        }
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
