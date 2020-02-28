import { organizationRoute } from 'states/utils';
import OrganizationUsage from 'account/usage/OrganizationUsage';

export default organizationRoute({
  name: 'usage',
  url: '/usage',
  component: OrganizationUsage
});
