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

import locales from 'states/settings/locales';
import extensions from 'states/settings/Extensions';

const store = getStore();

// TODO convert JST templates to hyperscript
/* global JST */

const newSpace = {
  name: 'new',
  url: '_new',
  template: JST.cf_create_space_advice(),
  controller: ['$scope', 'access_control/AccessChecker', function ($scope, accessChecker) {
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

const resolveSpaceData = ['services/TokenStore', '$stateParams', function (TokenStore, $stateParams) {
  return TokenStore.getSpace($stateParams.spaceId);
}];

const spaceEnvironment = {
  name: 'environment',
  url: '/environments/:environmentId',
  resolve: {
    spaceData: resolveSpaceData,
    spaceContext: ['spaceContext', 'spaceData', '$stateParams', function (spaceContext, spaceData, $stateParams) {
      return spaceContext.resetWithSpace(spaceData, $stateParams.environmentId);
    }]
  },
  views: {
    'content@': {
      template: '<div />',
      controller: ['spaceData', '$state', function (spaceData, $state) {
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
    {
      name: 'settings',
      url: '/settings',
      abstract: true,
      children: [locales, extensions]
    }
  ]
};

const spaceDetail = {
  name: 'detail',
  url: '/:spaceId',
  resolve: {
    spaceData: resolveSpaceData,
    spaceContext: ['spaceContext', 'spaceData', function (spaceContext, spaceData) {
      return spaceContext.resetWithSpace(spaceData);
    }]
  },
  onEnter: ['spaceData', function (spaceData) {
    Analytics.trackSpaceChange({data: spaceData});
  }],
  template: JST.cf_no_section_available(),
  controller: ['$scope', '$state', 'spaceData', function ($scope, $state, spaceData) {
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
