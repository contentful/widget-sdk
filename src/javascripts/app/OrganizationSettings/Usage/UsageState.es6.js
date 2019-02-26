import { reactStateWrapper } from 'app/OrganizationSettings/OrganizationSettingsRouteUtils.es6';

export default reactStateWrapper({
  name: 'usage',
  url: '/:orgId/usage',
  loadingText: 'Loading your usage…',
  componentPath: 'account/usage/OrganizationUsage.es6'
});
