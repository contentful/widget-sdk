import base from 'states/Base';
import accountProfileState from './accountProfile';
import orgSettingsState from 'app/OrganizationSettings/OrganizationSettingsState';

export default base({
  name: 'account',
  url: '/account',
  abstract: true,
  navComponent: () => null,
  children: [...orgSettingsState, accountProfileState]
});
