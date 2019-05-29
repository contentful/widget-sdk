import { reactStateWrapper } from 'app/OrganizationSettings/OrganizationSettingsRouteUtils.es6';

const list = reactStateWrapper({
  name: 'list',
  title: 'Space teams',
  loadingText: 'Loading teams…',
  url: '',
  componentPath: 'access_control/SpaceTeamsPage.es6'
});

export default {
  name: 'teams',
  url: '/teams',
  abstract: true,
  children: [list]
};
