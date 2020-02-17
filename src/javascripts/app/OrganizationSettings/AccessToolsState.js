import organizationBase from 'states/Base';
import ssoRoutingState from './SSO/SSOSetupRoutingState';
import userProvisioningState from './UserProvisioning/UserProvisioningState';
import OrganizationNavBar from 'navigation/OrganizationNavBar';

export default organizationBase({
  name: 'access-tools',
  url: '/access_tools',
  abstract: true,
  navComponent: OrganizationNavBar,
  children: [ssoRoutingState, userProvisioningState]
});
