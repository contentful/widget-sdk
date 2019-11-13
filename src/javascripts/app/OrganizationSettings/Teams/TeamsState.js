import { reactStateWrapper } from 'states/utils';

const teamDetailState = reactStateWrapper({
  name: 'detail',
  title: 'Teams',
  url: '/:teamId',
  componentPath: 'app/OrganizationSettings/Teams/TeamPage'
});

export default reactStateWrapper({
  name: 'teams',
  children: [teamDetailState],
  title: 'Teams',
  url: '/teams',
  componentPath: 'app/OrganizationSettings/Teams/TeamPage'
});
