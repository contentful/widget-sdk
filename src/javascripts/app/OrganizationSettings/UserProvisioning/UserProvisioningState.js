import { organizationRoute } from 'states/utils';
import UserProvisioning from 'app/OrganizationSettings/UserProvisioning/UserProvisioning';

export default organizationRoute({
  name: 'user-provisioning',
  url: '/user_provisioning',
  component: UserProvisioning
});
