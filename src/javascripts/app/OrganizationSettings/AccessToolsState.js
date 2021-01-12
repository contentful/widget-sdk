import { SSOSetupRoutingState } from 'features/sso';
import userProvisioningState from './UserProvisioning/UserProvisioningState';
import OrganizationNavBar from 'navigation/OrganizationNavBar';

export default {
  name: 'access-tools',
  url: '/access_tools',
  abstract: true,
  navComponent: OrganizationNavBar,
  children: [SSOSetupRoutingState, userProvisioningState],
};
