'use strict';

angular
  .module('contentful')
  /**
   * @ngdoc service
   * @name states/account
   */
  .factory('states/account/profile', [
    'require',
    require => {
      const _ = require('lodash');
      const base = require('states/Base.es6').default;
      const h = require('utils/legacy-html-hyperscript').h;

      const user = userBase({
        name: 'user',
        title: 'User settings',
        url: '/user{pathSuffix:PathSuffix}'
      });

      const spaceMemberships = userBase({
        name: 'space_memberships',
        title: 'Space memberships',
        url: '/space_memberships{pathSuffix:PathSuffix}'
      });

      const organizationMemberships = userBase({
        name: 'organization_memberships',
        title: 'Organization memberships',
        url: '/organization_memberships{pathSuffix:PathSuffix}'
      });

      const accessGrants = userBase({
        name: 'access_grants',
        title: 'OAuth tokens',
        url: '/access_grants{pathSuffix:PathSuffix}'
      });

      const applications = userBase({
        name: 'applications',
        title: 'Applications',
        url: '/developers/applications{pathSuffix:PathSuffix}'
      });

      const userCancellation = userBase({
        name: 'user_cancellation',
        title: 'User cancellation',
        url: '/user_cancellation{pathSuffix:PathSuffix}'
      });

      function userBase(definition) {
        const defaults = {
          label: 'Account',
          params: {
            pathSuffix: ''
          },
          template: [
            h('.workbench-header__wrapper', [
              h('header.workbench-header', [h('h1.workbench-header__title', [definition.title])])
            ]),
            h('cf-account-view', { context: 'context' })
          ].join('')
        };

        return base(_.extend(definition, defaults));
      }

      return base({
        name: 'profile',
        url: '/profile',
        abstract: true,
        views: {
          'nav-bar@': {
            template: h('cf-profile-nav', { class: 'app-top-bar__child' })
          }
        },
        children: [
          userCancellation,
          user,
          spaceMemberships,
          organizationMemberships,
          accessGrants,
          applications
        ]
      });
    }
  ]);
