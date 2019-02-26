import { reactStateWrapper } from 'app/OrganizationSettings/OrganizationSettingsRouteUtils.es6';

export default reactStateWrapper({
  name: 'sso',
  url: '/:orgId/sso',
  componentPath: 'app/OrganizationSettings/SSO/SSOSetup.es6'
});
