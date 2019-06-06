import { reactStateWrapper } from 'app/routeUtils.es6';

export default reactStateWrapper({
  name: 'sso',
  url: '/:orgId/sso',
  componentPath: 'app/OrganizationSettings/SSO/SSOSetup.es6'
});
