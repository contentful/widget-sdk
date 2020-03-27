import React from 'react';
import _ from 'lodash';
import * as ChangeSpaceService from 'services/ChangeSpaceService';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import { LocalesListSkeleton } from '../skeletons/LocalesListSkeleton';
import { LocalesFormSkeleton } from '../skeletons/LocalesFormSkeleton';
import createResourceService from 'services/ResourceService';
import { generateMessage } from 'utils/ResourceUtils';
import { SettingsImporter } from 'app/settings/SettingsImporter';

import LazyLoadedComponent from 'app/common/LazyLoadedComponent';

export default {
  name: 'locales',
  url: '/locales',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      component: (props) => (
        <LazyLoadedComponent fallback={LocalesListSkeleton} importer={SettingsImporter}>
          {({ LocalesListRoute }) => <LocalesListRoute {...props} />}
        </LazyLoadedComponent>
      ),
      resolve: {
        localeResource: [
          '$stateParams',
          async ($stateParams) => {
            /*
              The locales page already fetches the resource as part of its initial requests. We should remove
              this functionality from here and just keep it in the actual view.
             */
            const { spaceId } = $stateParams;

            const resources = createResourceService(spaceId);

            return resources.get('locale');
          },
        ],
      },
      mapInjectedToProps: [
        'spaceContext',
        'localeResource',
        (spaceContext, localeResource) => ({
          showUpgradeSpaceDialog: ({ onSubmit }) => {
            ChangeSpaceService.showDialog({
              organizationId: spaceContext.organization.sys.id,
              space: spaceContext.space.data,
              action: 'change',
              scope: 'space',
              onSubmit,
            });
          },
          getComputeLocalesUsageForOrganization: () => {
            /*
              The expectation of this function is a bit strange as it returns either a string or null, as it is the
              result of some legacy code. This should be refactored to be more clear in its intention.
             */
            if (generateMessage(localeResource).error) {
              return generateMessage(localeResource).error;
            } else {
              return null;
            }
          },
        }),
      ],
    },
    {
      name: 'new',
      url: '_new',
      component: (props) => (
        <LazyLoadedComponent fallback={LocalesFormSkeleton} importer={SettingsImporter}>
          {({ LocalesNewRoute }) => <LocalesNewRoute {...props} />}
        </LazyLoadedComponent>
      ),
      mapInjectedToProps: [
        '$scope',
        '$state',
        ($scope, $state) => ({
          registerSaveAction: (save) => {
            $scope.context.requestLeaveConfirmation = createUnsavedChangesDialogOpener(save);
            $scope.$applyAsync();
          },
          setDirty: (value) => {
            $scope.context.dirty = value;
            $scope.$applyAsync();
          },
          goToList: () => {
            $state.go('^.list');
          },
        }),
      ],
    },
    {
      name: 'detail',
      url: '/:localeId',
      component: (props) => (
        <LazyLoadedComponent fallback={LocalesFormSkeleton} importer={SettingsImporter}>
          {({ LocalesEditRoute }) => <LocalesEditRoute {...props} />}
        </LazyLoadedComponent>
      ),
      mapInjectedToProps: [
        '$scope',
        '$stateParams',
        '$state',
        ($scope, $stateParams, $state) => ({
          localeId: $stateParams.localeId,
          registerSaveAction: (save) => {
            $scope.context.requestLeaveConfirmation = createUnsavedChangesDialogOpener(save);
            $scope.$applyAsync();
          },
          setDirty: (value) => {
            $scope.context.dirty = value;
            $scope.$applyAsync();
          },
          goToList: () => {
            $state.go('^.list');
          },
        }),
      ],
    },
  ],
};
