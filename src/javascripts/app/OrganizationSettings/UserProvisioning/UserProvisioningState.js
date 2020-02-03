import { reactStateWrapper } from 'states/utils';
import UserProvisioning from 'app/OrganizationSettings/UserProvisioning/UserProvisioning';

export default reactStateWrapper({
  name: 'user-provisioning',
  url: '/user_provisioning',
  component: UserProvisioning
});
