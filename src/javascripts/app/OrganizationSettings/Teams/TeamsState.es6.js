import { reactStateWrapper } from 'app/routeUtils.es6';

const teamDetailState = reactStateWrapper({
  name: 'detail',
  title: 'Teams',
  url: '/:teamId',
  componentPath: 'app/OrganizationSettings/Teams/TeamPage.es6'
});

export default reactStateWrapper({
  name: 'teams',
  children: [teamDetailState],
  title: 'Teams',
  url: '/:orgId/teams',
  componentPath: 'app/OrganizationSettings/Teams/TeamPage.es6'
});
