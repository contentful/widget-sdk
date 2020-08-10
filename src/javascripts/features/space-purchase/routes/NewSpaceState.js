import { organizationRoute } from 'states/utils';
import { NewSpaceRoute } from './NewSpaceRoute';

export const newSpaceState = organizationRoute({
  name: 'new_space',
  url: '/new_space',
  component: NewSpaceRoute,
});
