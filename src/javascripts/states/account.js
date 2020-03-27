import base from 'states/Base';
import accountProfileState from './accountProfile';
import orgSettingsState from 'app/OrganizationSettings/OrganizationSettingsState';
import EmptyNavigationBar from 'navigation/EmptyNavigationBar';

export default base({
  name: 'account',
  url: '/account',
  abstract: true,
  navComponent: EmptyNavigationBar,
  children: [...orgSettingsState, accountProfileState],
});
