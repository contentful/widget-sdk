import base from 'states/Base.es6';
import accountProfileState from './accountProfile.es6';
import orgSettingsState from 'app/OrganizationSettings/OrganizationSettingsState.es6';

export default base({
  name: 'account',
  url: '/account',
  abstract: true,
  navComponent: () => null,
  children: [...orgSettingsState, accountProfileState]
});
