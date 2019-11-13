import { reactStateWrapper } from 'states/utils';

export default reactStateWrapper({
  name: 'usage',
  url: '/usage',
  loadingText: 'Loading your usage…',
  componentPath: 'account/usage/OrganizationUsage'
});
