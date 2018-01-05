import { h } from 'utils/hyperscript';
import { getStore } from 'utils/TheStore';
import sectionAccess from 'sectionAccess';
import * as Analytics from 'analytics/Analytics';
import * as TokenStore from 'services/TokenStore';
import spaceContext from 'spaceContext';

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
  controller: ['$scope', 'accessChecker', function ($scope, accessChecker) {
    $scope.canCreateSpace = accessChecker.canCreateSpace;
  }]
};


const spaceDetail = {
  name: 'detail',
  url: '/:spaceId',
  resolve: {
    spaceContext: ['$stateParams', function ($stateParams) {
      return TokenStore.getSpace($stateParams.spaceId)
      .then(function (space) {
        return spaceContext.resetWithSpace(space);
      });
    }]
  },
  onEnter: ['spaceContext', function (spaceContext) {
    Analytics.trackSpaceChange(spaceContext.space);
  }],
  controller: ['$scope', 'spaceContext', function ($scope, spaceContext) {
    const space = spaceContext.space;
    $scope.label = space.data.name;

    if (sectionAccess.hasAccessToAny()) {
      sectionAccess.redirectToFirstAccessible();
      store.set('lastUsedSpace', space.getId());
      store.set('lastUsedOrg', space.getOrganizationId());
    }
  }],
  templateProvider: ['spaceContext', function (spaceContext) {
    if (spaceContext.space.isHibernated()) {
      return JST.cf_space_hibernation_advice();
    } else if (!sectionAccess.hasAccessToAny()) {
      return JST.cf_no_section_available();
    }
  }],
  children: [
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
