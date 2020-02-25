import React from 'react';
import * as SpaceEnvironmentRepo from 'data/CMA/SpaceEnvironmentsRepo';
import * as SpaceAliasesRepo from 'data/CMA/SpaceAliasesRepo';
import { redirectReadOnlySpace } from 'states/SpaceSettingsBase';
import { spaceResolver } from 'states/Resolvers';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import { SettingsImporter } from 'app/settings/SettingsImporter';
import KeyEditorWorkbench from '../api-key-editor/KeyEditorWorkbench';

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
          component: props => (
            <LazyLoadedComponent importer={SettingsImporter} fallback={() => null}>
              {({ ApiKeyListRoute }) => <ApiKeyListRoute {...props} />}
            </LazyLoadedComponent>
          )
        },
        {
          name: 'detail',
          url: '/:apiKeyId',
          component: props => (
            <LazyLoadedComponent importer={SettingsImporter} fallback={KeyEditorWorkbench}>
              {({ KeyEditorRoute }) => <KeyEditorRoute {...props} />}
            </LazyLoadedComponent>
          ),
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
      name: 'cma_tokens',
      url: '/cma_tokens',
      component: props => (
        <LazyLoadedComponent importer={SettingsImporter} fallback={KeyEditorWorkbench}>
          {({ CMATokensRoute }) => <CMATokensRoute {...props} />}
        </LazyLoadedComponent>
      )
    },
    {
      // Legacy path
      name: 'cma_keys',
      url: '/cma_keys',
      redirectTo: 'spaces.detail.api.cma_tokens'
    },
    {
      // Legacy path
      name: 'content_model',
      url: '/content_model',
      redirectTo: 'spaces.detail.content_types.list'
    }
  ]
};
