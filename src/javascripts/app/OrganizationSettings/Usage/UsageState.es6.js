import { reactStateWrapper } from 'app/routeUtils.es6';

export default reactStateWrapper({
  name: 'usage',
  url: '/:orgId/usage',
  loadingText: 'Loading your usage…',
  componentPath: 'account/usage/OrganizationUsage.es6'
});
