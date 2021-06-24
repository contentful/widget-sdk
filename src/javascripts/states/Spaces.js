import { makeLink } from '@contentful/types';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { getFirstAccessibleSref } from 'access_control/SectionAccess';
import * as Analytics from 'analytics/Analytics';
import * as accessChecker from 'access_control/AccessChecker';
import SpaceNavigationBar from 'navigation/SpaceNavigationBar';

import * as TokenStore from 'services/TokenStore';

import { appRoute as apps } from 'features/apps';
import { apiKeysState } from './settingsApiKeys';
import { assetViewState, entryViewState } from 'features/entity-views';
import stackOnboarding from './stackOnboarding';
import settings from './settings';
import { scheduledActionsState } from 'features/scheduled-actions';
import { tasksRouteState } from 'features/tasks';
import { pageExtensionsState } from 'features/page-widgets';
import { spaceHomeState } from 'features/space-home';
import { SpaceHibernationRoute, isHibernated } from 'features/space-hibernation';
import AccessForbidden from 'components/access-forbidden/AccessForbidden';
import { getSpaceContext } from 'classes/spaceContext';
import { router } from 'core/react-routing';
import { contentTypesState } from 'features/content-model-editor';

const store = getBrowserStorage();

const hibernation = {
  name: 'hibernation',
  url: '/hibernation',
  navComponent: () => null,
  component: SpaceHibernationRoute,
};

const resolveSpaceData = [
  '$stateParams',
  ($stateParams) => TokenStore.getSpace($stateParams.spaceId),
];

const spaceEnvironment = {
  name: 'environment',
  url: '/:spaceId/environments/:environmentId',
  resolve: {
    spaceData: resolveSpaceData,
    initializingSpaceEnvContext: [
      'spaceData',
      '$stateParams',
      async (spaceData, $stateParams) => {
        const spaceContext = getSpaceContext();
        const result = await spaceContext.resetWithSpace(spaceData, $stateParams.environmentId);
        return result;
      },
    ],
  },
  onEnter: [
    'spaceData',
    '$state',
    '$stateParams',
    (spaceData, $state, $stateParams) => {
      const organizationData = spaceData.organization;
      const environmentLink = makeLink('Environment', $stateParams.environmentId || 'master');
      Analytics.trackContextChange({
        organization: organizationData,
        space: spaceData,
        environment: environmentLink,
      });

      // if there's empty environment id, for example "/environments//"
      // redirect to master environment
      if (!$stateParams.environmentId) {
        $state.go('spaces.detail', $stateParams, { reload: true });
        return;
      }

      storeCurrentIds(spaceData);
    },
  ],
  template: '<react-component component="component" props="props"></react-component>',
  controller: [
    'initializingSpaceEnvContext',
    'spaceData',
    '$state',
    '$stateParams',
    (_, spaceData, $state, $stateParams) => {
      if (!accessChecker.can('manage', 'Environments')) {
        $state.go('spaces.detail', $stateParams, { reload: true });
      } else if (isHibernated(spaceData)) {
        router.navigate({ path: 'hibernation', spaceId: $stateParams.spaceId }, { reload: true });
      } else {
        router.navigate({ path: 'entries.list', spaceId: $stateParams.spaceId });
      }
    },
  ],
  children: [
    contentTypesState,
    entryViewState.withoutSnapshots,
    assetViewState,
    apiKeysState,
    apps,
    // Some of the settings states are not children of environments
    // conceptually. However, we want to prevent users going to space
    // settings and switching to the master environment in the process.
    settings,
    scheduledActionsState,
    tasksRouteState,
    pageExtensionsState,
  ],
};

const spaceDetail = {
  name: 'detail',
  url: '/:spaceId',
  resolve: {
    spaceData: resolveSpaceData,
    initializingSpaceContext: [
      'spaceData',
      async (spaceData) => {
        const spaceContext = getSpaceContext();
        const result = await spaceContext.resetWithSpace(spaceData, undefined);
        return result;
      },
    ],
  },
  onEnter: [
    'spaceData',
    (spaceData) => {
      const organizationData = spaceData.organization;
      const environmentLink = makeLink('Environment', 'master');
      Analytics.trackContextChange({
        organization: organizationData,
        space: spaceData,
        environment: environmentLink,
      });
      storeCurrentIds(spaceData);
    },
  ],
  template: '<react-component component="component" props="props"></react-component>',
  controller: [
    'initializingSpaceContext',
    '$scope',
    '$state',
    'spaceData',
    '$stateParams',
    (_, $scope, $state, spaceData, $stateParams) => {
      const spaceContext = getSpaceContext();

      const accessibleSref = getFirstAccessibleSref(spaceContext.space);

      if (isHibernated(spaceData)) {
        router.navigate({ path: 'hibernation', spaceId: $stateParams.spaceId });
      } else if (accessibleSref) {
        $state.go(accessibleSref.path, accessibleSref.params || null, { location: 'replace' });
      } else {
        $scope.component = AccessForbidden;
      }
    },
  ],
  children: [
    hibernation,
    contentTypesState,
    entryViewState.withSnapshots,
    assetViewState,
    apiKeysState,
    settings,
    spaceHomeState,
    stackOnboarding,
    apps,
    scheduledActionsState,
    tasksRouteState,
    pageExtensionsState,
  ],
};

function storeCurrentIds(space) {
  store.set('lastUsedSpace', space.sys.id);
  store.set('lastUsedOrg', space.organization.sys.id);
}

const spacesState = {
  name: 'spaces',
  url: '/spaces',
  abstract: true,
  navComponent: SpaceNavigationBar,
  children: [spaceEnvironment, spaceDetail],
};

export default spacesState;
