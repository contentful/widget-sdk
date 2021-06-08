import accountProfileState from './accountProfile';
import { organization } from './organization';
import newOrganizationState from './newOrganization';
import EmptyNavigationBar from 'navigation/EmptyNavigationBar';

const accountState = {
  name: 'account',
  url: '/account',
  abstract: true,
  navComponent: EmptyNavigationBar,
  children: [newOrganizationState, organization, accountProfileState],
};

export default accountState;
