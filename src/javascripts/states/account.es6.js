import base from 'states/Base.es6';
import navBar from 'navigation/templates/NavBar.es6';
import accountProfileState from './accountProfile.es6';
import orgSettingsState from 'app/OrganizationSettings/OrganizationSettingsState.es6';

export default base({
  name: 'account',
  url: '/account',
  abstract: true,
  views: { 'nav-bar@': { template: navBar() } },
  children: [orgSettingsState, accountProfileState]
});
