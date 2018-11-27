import { reactStateWrapper } from 'app/OrganizationSettings/OrganizationSettingsRouteUtils.es6';

export default reactStateWrapper({
  name: 'detail',
  title: 'Teams',
  url: '/:teamId',
  componentPath: 'app/OrganizationSettings/Teams/TeamDetail/TeamDetailRoute.es6'
});
