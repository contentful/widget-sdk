import { getStore } from 'browserStorage';
import { getFirstAccessibleSref } from 'access_control/SectionAccess';
import * as Analytics from 'analytics/Analytics';
import * as accessChecker from 'access_control/AccessChecker';
import SpaceNavigationBar from 'navigation/SpaceNavigationBar';

import * as TokenStore from 'services/TokenStore';

import contentTypes from './contentTypes';
import apps from 'app/Apps/routes';
import api from 'app/settings/api/routes';
import entries from './entries';
import assets from './assets';
import home from './spaceHome';
import stackOnboarding from './stackOnboarding';
import settings from './settings';
import scheduledActions from 'app/ScheduledActions/routes';
import tasks from 'app/TasksPage/routes';
import pageExtensions from 'app/pageExtensions/routes';
import EmptyNavigationBar from 'navigation/EmptyNavigationBar';

import createSpaceAdviceTemplate from 'components/app_container/cf_create_space_advice.html';
import SpaceHibernationAdvice from 'components/app_container/SpaceHibernationAdvice';
import noSectionAvailableTemplate from 'components/app_container/cf_no_section_available.html';

const store = getStore();

const newSpace = {
  name: 'new',
  url: '_new',
  template: createSpaceAdviceTemplate,
  controller: [
    '$scope',
    $scope => {
      $scope.canCreateSpace = accessChecker.canCreateSpace;
    }
  ]
};

const hibernation = {
  name: 'hibernation',
  url: '/hibernation',
  navComponent: EmptyNavigationBar,
  component: SpaceHibernationAdvice
};

const resolveSpaceData = [
  '$stateParams',
  $stateParams => TokenStore.getSpace($stateParams.spaceId)
];

const spaceEnvironment = {
  name: 'environment',
  url: '/environments/:environmentId',
  resolve: {
    spaceData: resolveSpaceData,
    spaceContext: [
      'spaceContext',
      'spaceData',
      '$stateParams',
      (spaceContext, spaceData, $stateParams) =>
        spaceContext.resetWithSpace(spaceData, $stateParams.environmentId)
    ]
  },
  template: '<div />',
  controller: [
    'spaceData',
    '$state',
    (spaceData, $state) => {
      if (!accessChecker.can('manage', 'Environments')) {
        $state.go('spaces.detail', null, { reload: true });
      } else if (isHibernated(spaceData)) {
        $state.go('spaces.detail.hibernation', null, { reload: true });
      } else {
        storeCurrentIds(spaceData);
        $state.go('.entries.list');
      }
    }
  ],
  children: [
    contentTypes,
    entries.withoutSnapshots,
    assets,
    api,
    apps,
    // Some of the settings states are not children of environments
    // conceptually. However, we want to prevent users going to space
    // settings and switching to the master environment in the process.
    settings,
    scheduledActions,
    tasks,
    pageExtensions
  ]
};

const spaceDetail = {
  name: 'detail',
  url: '/:spaceId',
  resolve: {
    spaceData: resolveSpaceData,
    spaceContext: [
      'spaceContext',
      'spaceData',
      '$stateParams',
      (spaceContext, spaceData, $stateParams) =>
        spaceContext.resetWithSpace(spaceData, $stateParams.environmentId)
    ]
  },
  onEnter: [
    'spaceData',
    spaceData => {
      const organizationData = spaceData.organization;
      Analytics.trackContextChange(spaceData, organizationData);
    }
  ],
  template: noSectionAvailableTemplate,
  controller: [
    '$scope',
    '$state',
    'spaceData',
    ($scope, $state, spaceData) => {
      const accessibleSref = getFirstAccessibleSref();

      if (isHibernated(spaceData)) {
        $state.go('.hibernation');
      } else if (accessibleSref) {
        storeCurrentIds(spaceData);
        $state.go(accessibleSref);
      } else {
        $scope.noSectionAvailable = true;
      }
    }
  ],
  children: [
    hibernation,
    contentTypes,
    entries.withSnapshots,
    assets,
    api,
    settings,
    home,
    spaceEnvironment,
    stackOnboarding,
    apps,
    scheduledActions,
    tasks,
    pageExtensions
  ]
};

function isHibernated(space) {
  return (space.enforcements || []).some(e => e.reason === 'hibernated');
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
  children: [newSpace, spaceDetail]
};
