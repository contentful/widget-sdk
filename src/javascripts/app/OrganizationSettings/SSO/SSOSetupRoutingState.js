import { reactStateWrapper } from 'states/utils';
import SSOSetup from 'app/OrganizationSettings/SSO/SSOSetup';

export default reactStateWrapper({
  name: 'sso',
  url: '/sso',
  component: SSOSetup
});
