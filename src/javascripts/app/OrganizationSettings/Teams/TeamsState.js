import { reactStateWrapper } from 'states/utils';
import TeamPage from 'app/OrganizationSettings/Teams/TeamPage';

const teamDetailState = reactStateWrapper({
  name: 'detail',
  title: 'Teams',
  url: '/:teamId',
  component: TeamPage
});

export default reactStateWrapper({
  name: 'teams',
  children: [teamDetailState],
  title: 'Teams',
  url: '/teams',
  component: TeamPage
});
