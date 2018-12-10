'use strict';

angular
  .module('contentful')
  /**
   * @ngdoc service
   * @name states/account
   */
  .factory('states/account', [
    'require',
    require => {
      const base = require('states/Base.es6').default;
      const orgSettings = require('app/OrganizationSettings/OrganizationSettingsState.es6').default;
      const navBar = require('navigation/templates/NavBar.es6').default;

      return base({
        name: 'account',
        url: '/account',
        abstract: true,
        views: { 'nav-bar@': { template: navBar() } },
        children: [orgSettings, require('states/account/profile')]
      });
    }
  ]);
