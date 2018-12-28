import { reactStateWrapper } from 'app/OrganizationSettings/OrganizationSettingsRouteUtils.es6';

const teamDetailState = reactStateWrapper({
  name: 'detail',
  title: 'Teams',
  url: '/:teamId',
  componentPath: 'app/OrganizationSettings/Teams/TeamDetails.es6'
});

export default reactStateWrapper({
  name: 'teams',
  children: [teamDetailState],
  title: 'Teams',
  url: '/:orgId/teams',
  componentPath: 'app/OrganizationSettings/Teams/TeamList.es6'
});
