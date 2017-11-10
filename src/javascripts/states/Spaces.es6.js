import { h } from 'utils/hyperscript';
import TheStore from 'TheStore';
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
    }],
    space: ['spaceContext', function (spaceContext) {
      return spaceContext.space;
    }],
    widgets: ['spaceContext', function (spaceContext) {
      return spaceContext.widgets;
    }]
  },
  onEnter: ['space', function (space) {
    Analytics.trackSpaceChange(space);
  }],
  controller: ['$scope', 'space', function ($scope, space) {
    $scope.label = space.data.name;

    if (sectionAccess.hasAccessToAny()) {
      sectionAccess.redirectToFirstAccessible();
      TheStore.set('lastUsedSpace', space.getId());
      TheStore.set('lastUsedOrg', space.getOrganizationId());
    }
  }],
  templateProvider: ['space', function (space) {
    if (space.isHibernated()) {
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
      template: h('cf-space-nav-bar', {class: 'app-top-bar__child'})
    }
  },
  children: [newSpace, spaceDetail]
};
