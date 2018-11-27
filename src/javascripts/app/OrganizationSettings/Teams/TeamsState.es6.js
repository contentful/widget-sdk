import { reactStateWrapper } from 'app/OrganizationSettings/OrganizationSettingsRouteUtils.es6';
import teamDetailState from './TeamDetail/TeamDetailState.es6';

export default reactStateWrapper({
  name: 'teams',
  children: [teamDetailState],
  title: 'Teams',
  url: '/:orgId/teams',
  componentPath: 'app/OrganizationSettings/Teams/TeamList/TeamListRoute.es6'
});
