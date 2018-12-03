import { reactStateWrapper } from 'app/OrganizationSettings/OrganizationSettingsRouteUtils.es6';

const teamDetailState = reactStateWrapper({
  name: 'detail',
  title: 'Teams',
  url: '/:teamId',
  componentPath: 'app/OrganizationSettings/Teams/TeamDetail/TeamDetailRoute.es6'
});

export default reactStateWrapper({
  name: 'teams',
  children: [teamDetailState],
  title: 'Teams',
  url: '/:orgId/teams',
  featureFlag: 'feature-bv-09-2018-new-org-membership-pages',
  componentPath: 'app/OrganizationSettings/Teams/TeamList/TeamListRoute.es6'
});
