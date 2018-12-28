import { registerFactory } from 'NgRegistry.es6';
import base from 'states/Base.es6';
import navBar from 'navigation/templates/NavBar.es6';

/**
 * @ngdoc service
 * @name states/account
 */
registerFactory('states/account', [
  'states/account/profile',
  'app/OrganizationSettings/OrganizationSettingsState.es6',
  (accountProfileState, { default: orgSettingsState }) =>
    base({
      name: 'account',
      url: '/account',
      abstract: true,
      views: { 'nav-bar@': { template: navBar() } },
      children: [orgSettingsState, accountProfileState]
    })
]);
