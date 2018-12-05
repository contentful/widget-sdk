import { h } from 'utils/legacy-html-hyperscript';
import { getStore } from 'TheStore';
import { getFirstAccessibleSref } from 'access_control/SectionAccess.es6';
import * as Analytics from 'analytics/Analytics.es6';
import * as accessChecker from 'access_control/AccessChecker';

import contentTypes from 'states/contentTypes';
import entries from 'states/entries';
import assets from 'states/assets';
import api from 'app/api/State.es6';
import settings from 'states/settings';
import home from 'states/space_home';
import stackOnboarding from 'states/stackOnboarding';
import apps from 'app/settings/apps/routes/index.es6';

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
  views: {
    'nav-bar@': { template: '<div />' },
    'content@': { template: JST.cf_space_hibernation_advice() }
  }
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
  views: {
    'content@': {
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
      ]
    }
  },
  children: [
    contentTypes,
    entries.withoutSnapshots,
    assets,
    api,
    // Some of the settings states are not children of environments
    // conceptually. However, we want to prevent users going to space
    // settings and switching to the master environment in the process.
    settings
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
    apps
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
  views: {
    'nav-bar@': {
      template: h('div.app-top-bar__child.app-top-bar__main-nav.app-top-bar__with-right-part', [
        h('cf-space-nav-bar-wrapped', { class: 'app-top-bar__child' }),
        h('cf-authors-help', { class: 'app-top-bar__child' }),
        h('react-component', { name: 'ms-relaunch', class: 'app-top-bar__child' }) // defined in modernStackOnboardingRelaunch.js
      ])
    }
  },
  children: [newSpace, spaceDetail]
};
