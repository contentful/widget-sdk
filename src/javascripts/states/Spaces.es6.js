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

const spaceDetail = {
  name: 'detail',
  url: '/:spaceId',
  resolve: {
    spaceData: ['services/TokenStore', '$stateParams', function (TokenStore, $stateParams) {
      return TokenStore.getSpace($stateParams.spaceId);
    }],
    spaceContext: ['spaceContext', 'spaceData', function (spaceContext, spaceData) {
      return spaceContext.resetWithSpace(spaceData);
    }]
  },
  onEnter: ['spaceData', function (spaceData) {
    Analytics.trackSpaceChange({data: spaceData});
  }],
  template: JST.cf_no_section_available(),
  controller: ['$scope', '$state', 'spaceData', function ($scope, $state, spaceData) {
    const isHibernated = (spaceData.enforcements || []).some(e => e.reason === 'hibernated');
    const accessibleSref = sectionAccess.getFirstAccessibleSref();

    if (isHibernated) {
      $state.go('.hibernation');
    } else if (accessibleSref) {
      store.set('lastUsedSpace', spaceData.sys.id);
      store.set('lastUsedOrg', spaceData.organization.sys.id);
      $state.go(accessibleSref);
    } else {
      $scope.noSectionAvailable = true;
    }
  }],
  children: [
    hibernation,
    contentTypes,
    entries,
    assets,
    api,
    settings,
    home
  ]
};


export default {
  name: 'spaces',
  url: '/spaces',
  abstract: true,
  views: {
    'nav-bar@': {
      template: h('div.app-top-bar__child.app-top-bar__main-nav.app-top-bar__with-right-part', [
        h('cf-space-nav-bar', {class: 'app-top-bar__child'}),
        h('cf-authors-help', {class: 'app-top-bar__child'})
      ])
    }
  },
  children: [newSpace, spaceDetail]
};
