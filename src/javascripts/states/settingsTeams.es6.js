import { reactStateWrapper } from 'app/routeUtils.es6';

const list = reactStateWrapper({
  name: 'list',
  title: 'Space teams',
  loadingText: 'Loading teams…',
  url: '',
  componentPath: 'access_control/SpaceTeams/SpaceTeamsPage.es6'
});

export default {
  name: 'teams',
  url: '/teams',
  abstract: true,
  children: [list]
};
