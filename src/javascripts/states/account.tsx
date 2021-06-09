import accountProfileState from './accountProfile';
import { organizationReactState } from './organization';
import newOrganizationState from './newOrganization';
import EmptyNavigationBar from 'navigation/EmptyNavigationBar';

const accountState = {
  name: 'account',
  url: '/account',
  abstract: true,
  navComponent: EmptyNavigationBar,
  children: [newOrganizationState, organizationReactState, accountProfileState],
};

export default accountState;
