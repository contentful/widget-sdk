import { h } from 'utils/legacy-html-hyperscript/index.es6';
import { getStore } from 'TheStore/index.es6';
import { getFirstAccessibleSref } from 'access_control/SectionAccess.es6';
import * as Analytics from 'analytics/Analytics.es6';
import * as accessChecker from 'access_control/AccessChecker/index.es6';

import contentTypes from './contentTypes.es6';
import apps from 'app/settings/apps/routes/index.es6';
import appsBeta from 'app/settings/AppsBeta/index.es6';
import api from 'app/api/State.es6';
import entries from './entries.es6';
import assets from './assets.es6';
import home from './spaceHome.es6';
import stackOnboarding from './stackOnboarding.es6';
import settings from './settings.es6';
import jobs from 'app/jobs/routes/index.es6';
import pageExtensions from 'app/pageExtensions/routes/index.es6';

const store = getStore();

// TODO convert JST templates to hyperscript
/* global JST */

const newSpace = {
  name: 'new',
  url: '_new',
  template: JST.cf_create_space_advice(),
  controller: [
    '$scope',
    'access_control/AccessChecker',
    ($scope, accessChecker) => {
      $scope.canCreateSpace = accessChecker.canCreateSpace;
    }
  ]
};

const hibernation = {
  name: 'hibernation',
  url: '/hibernation',
  navTemplate: '<div />',
  template: JST.cf_space_hibernation_advice()
};

const resolveSpaceData = [
  'services/TokenStore.es6',
  '$stateParams',
  (TokenStore, $stateParams) => TokenStore.getSpace($stateParams.spaceId)
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
    appsBeta,
    // Some of the settings states are not children of environments
    // conceptually. However, we want to prevent users going to space
    // settings and switching to the master environment in the process.
    settings,
    jobs,
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
      (spaceContext, spaceData) => spaceContext.resetWithSpace(spaceData)
    ]
  },
  onEnter: [
    'spaceData',
    spaceData => {
      const organizationData = spaceData.organization;
      Analytics.trackContextChange(spaceData, organizationData);
    }
  ],
  template: JST.cf_no_section_available(),
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
    appsBeta,
    jobs,
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
  navTemplate: h('div.app-top-bar__child.app-top-bar__main-nav.app-top-bar__with-right-part', [
    h('cf-space-nav-bar-wrapped', { class: 'app-top-bar__child app-top-bar__child-wide' }),
    h('react-component', {
      name: 'navigation/modernStackOnboardingRelaunch.es6',
      class: 'app-top-bar__child'
    })
  ]),
  children: [newSpace, spaceDetail]
};
