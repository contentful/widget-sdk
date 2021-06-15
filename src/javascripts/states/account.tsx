import accountProfileState from './accountProfile';
import { organizationReactState } from './organization';
import newOrganizationState from './newOrganization';

const accountState = {
  name: 'account',
  url: '/account',
  abstract: true,
  navComponent: () => null,
  children: [newOrganizationState, organizationReactState, accountProfileState],
};

export default accountState;
