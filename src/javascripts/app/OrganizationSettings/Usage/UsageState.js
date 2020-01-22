import { reactStateWrapper } from 'states/utils';
import OrganizationUsage from 'account/usage/OrganizationUsage';

export default reactStateWrapper({
  name: 'usage',
  url: '/usage',
  loadingText: 'Loading your usage…',
  component: OrganizationUsage
});
