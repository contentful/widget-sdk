import { reactStateWrapper } from 'states/utils.es6';

export default reactStateWrapper({
  name: 'usage',
  url: '/:orgId/usage',
  loadingText: 'Loading your usage…',
  componentPath: 'account/usage/OrganizationUsage'
});
