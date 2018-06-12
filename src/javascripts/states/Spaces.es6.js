import { h } from 'utils/hyperscript';
import { getStore } from 'TheStore';
import sectionAccess from 'sectionAccess';
import * as Analytics from 'analytics/Analytics';

import contentTypes from './contentTypes';
import entries from './entries';
import assets from './assets';
import api from 'app/api/State';
import settings from './settings';
import home from './space_home';

const store = getStore();

// TODO convert JST templates to hyperscript
/* global JST */

const newSpace = {
  name: 'new',
  url: '_new',
  template: JST.cf_create_space_advice(),
  controller: ['$scope', 'access_control/AccessChecker', ($scope, accessChecker) => {
    $scope.canCreateSpace = accessChecker.canCreateSpace;
  }]
};

const hibernation = {
  name: 'hibernation',
  url: '/hibernation',
  views: {
    'nav-bar@': {template: '<div />'},
    'content@': {template: JST.cf_space_hibernation_advice()}
  }
};

const resolveSpaceData = ['services/TokenStore', '$stateParams', (TokenStore, $stateParams) => TokenStore.getSpace($stateParams.spaceId)];

const spaceEnvironment = {
  name: 'environment',
  url: '/environments/:environmentId',
  resolve: {
    spaceData: resolveSpaceData,
    spaceContext: ['spaceContext', 'spaceData', '$stateParams', (spaceContext, spaceData, $stateParams) => spaceContext.resetWithSpace(spaceData, $stateParams.environmentId)]
  },
  views: {
    'content@': {
      template: '<div />',
      controller: ['spaceData', '$state', (spaceData, $state) => {
        if (!spaceData.spaceMembership.admin) {
          $state.go('spaces.detail', null, {reload: true});
        } else if (isHibernated(spaceData)) {
          $state.go('spaces.detail.hibernation', null, {reload: true});
        } else {
          storeCurrentIds(spaceData);
          $state.go('.entries.list');
        }
      }]
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
    spaceContext: ['spaceContext', 'spaceData', (spaceContext, spaceData) => spaceContext.resetWithSpace(spaceData)]
  },
  onEnter: ['spaceData', spaceData => {
    Analytics.trackSpaceChange({data: spaceData});
  }],
  template: JST.cf_no_section_available(),
  controller: ['$scope', '$state', 'spaceData', ($scope, $state, spaceData) => {
    const accessibleSref = sectionAccess.getFirstAccessibleSref();

    if (isHibernated(spaceData)) {
      $state.go('.hibernation');
    } else if (accessibleSref) {
      storeCurrentIds(spaceData);
      $state.go(accessibleSref);
    } else {
      $scope.noSectionAvailable = true;
    }
  }],
  children: [
    hibernation,
    contentTypes,
    entries.withSnapshots,
    assets,
    api,
    settings,
    home,
    spaceEnvironment
  ]
};

function isHibernated (space) {
  return (space.enforcements || []).some(e => e.reason === 'hibernated');
}

function storeCurrentIds (space) {
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
        h('cf-space-nav-bar-wrapped', {class: 'app-top-bar__child'}),
        h('cf-authors-help', {class: 'app-top-bar__child'})
      ])
    }
  },
  children: [newSpace, spaceDetail]
};
