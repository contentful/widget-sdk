import { organizationRoute } from 'states/utils';
import TeamPage from 'app/OrganizationSettings/Teams/TeamPage';

const teamDetailState = organizationRoute({
  name: 'detail',
  url: '/:teamId',
  component: TeamPage
});

export default organizationRoute({
  name: 'teams',
  children: [teamDetailState],
  url: '/teams',
  component: TeamPage
});
