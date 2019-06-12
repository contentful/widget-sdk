import { reactStateWrapper } from 'states/utils.es6';

export default reactStateWrapper({
  name: 'sso',
  url: '/:orgId/sso',
  componentPath: 'app/OrganizationSettings/SSO/SSOSetup.es6'
});
