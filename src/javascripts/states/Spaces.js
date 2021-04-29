import { getBrowserStorage } from 'core/services/BrowserStorage';
import { getFirstAccessibleSref } from 'access_control/SectionAccess';
import * as Analytics from 'analytics/Analytics';
import * as accessChecker from 'access_control/AccessChecker';
import SpaceNavigationBar from 'navigation/SpaceNavigationBar';

import * as TokenStore from 'services/TokenStore';

import contentTypes from './contentTypes';
import { appRoute as apps } from 'features/apps';
import { apiKeysState } from './settingsApiKeys';
import { assetViewState, entryViewState } from 'features/entity-views';
import stackOnboarding from './stackOnboarding';
import settings from './settings';
import scheduledActions from 'app/ScheduledActions/routes';
import tasks from 'app/TasksPage/routes';
import { pageExtensionsState } from 'features/page-widgets';
import EmptyNavigationBar from 'navigation/EmptyNavigationBar';
import { spaceHomeState } from 'features/space-home';

import SpaceHibernationAdvice from 'components/app_container/SpaceHibernationAdvice';
import AccessForbidden from 'components/access-forbidden/AccessForbidden';
import { getSpaceContext } from 'classes/spaceContext';

const store = getBrowserStorage();

const hibernation = {
  name: 'hibernation',
  url: '/hibernation',
  navComponent: EmptyNavigationBar,
  component: SpaceHibernationAdvice,
};

const resolveSpaceData = [
  '$stateParams',
  ($stateParams) => TokenStore.getSpace($stateParams.spaceId),
];

const initializingSpaceContext = [
  'spaceData',
  '$stateParams',
  '$rootScope',
  (spaceData, $stateParams) => {
    const spaceContext = getSpaceContext();
    return spaceContext.resetWithSpace(spaceData, $stateParams.environmentId);
  },
];

const spaceEnvironment = {
  name: 'environment',
  url: '/environments/:environmentId',
  resolve: {
    spaceData: resolveSpaceData,
    initializingSpaceContext,
  },
  template: '<div />',
  controller: [
    'initializingSpaceContext',
    'spaceData',
    '$state',
    (_, spaceData, $state) => {
      if (!accessChecker.can('manage', 'Environments')) {
        $state.go('spaces.detail', null, { reload: true });
      } else if (isHibernated(spaceData)) {
        $state.go('spaces.detail.hibernation', null, { reload: true });
      } else {
        storeCurrentIds(spaceData);
        $state.go('.entries.list');
      }
    },
  ],
  children: [
    contentTypes,
    entryViewState.withoutSnapshots,
    assetViewState,
    apiKeysState,
    apps,
    // Some of the settings states are not children of environments
    // conceptually. However, we want to prevent users going to space
    // settings and switching to the master environment in the process.
    settings,
    scheduledActions,
    tasks,
    pageExtensionsState,
  ],
};

const spaceDetail = {
  name: 'detail',
  url: '/:spaceId',
  resolve: {
    spaceData: resolveSpaceData,
    initializingSpaceContext,
  },
  onEnter: [
    'spaceData',
    (spaceData) => {
      const organizationData = spaceData.organization;
      Analytics.trackContextChange(spaceData, organizationData);
    },
  ],
  template: '<react-component component="component" props="props"></react-component>',
  controller: [
    'initializingSpaceContext',
    '$scope',
    '$state',
    'spaceData',
    (_, $scope, $state, spaceData) => {
      const spaceContext = getSpaceContext();

      const accessibleSref = getFirstAccessibleSref(spaceContext.space);

      if (isHibernated(spaceData)) {
        $state.go('.hibernation');
      } else if (accessibleSref) {
        storeCurrentIds(spaceData);
        $state.go(accessibleSref.path, accessibleSref.params || null, { location: 'replace' });
      } else {
        $scope.component = AccessForbidden;
      }
    },
  ],
  children: [
    hibernation,
    contentTypes,
    entryViewState.withSnapshots,
    assetViewState,
    apiKeysState,
    settings,
    spaceHomeState,
    spaceEnvironment,
    stackOnboarding,
    apps,
    scheduledActions,
    tasks,
    pageExtensionsState,
  ],
};

function isHibernated(space) {
  return (space.enforcements || []).some((e) => e.reason === 'hibernated');
}

function storeCurrentIds(space) {
  store.set('lastUsedSpace', space.sys.id);
  store.set('lastUsedOrg', space.organization.sys.id);
}

export default {
  name: 'spaces',
  url: '/spaces',
  abstract: true,
  navComponent: SpaceNavigationBar,
  children: [spaceDetail],
};
