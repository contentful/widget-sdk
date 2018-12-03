import { reactStateWrapper } from 'app/OrganizationSettings/OrganizationSettingsRouteUtils.es6';

export default reactStateWrapper({
  name: 'usage',
  url: '/:orgId/usage',
  label: 'Usage',
  componentPath: 'account/usage/OrganizationUsage.es6'
});
