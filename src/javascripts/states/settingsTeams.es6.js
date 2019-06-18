import { reactStateWrapper } from './utils.es6';

const list = reactStateWrapper({
  name: 'list',
  title: 'Space teams',
  loadingText: 'Loading teams…',
  url: '',
  componentPath: 'access_control/SpaceTeams/SpaceTeamsPage.es6'
});

const add = reactStateWrapper({
  name: 'add',
  url: '/add',
  componentPath: 'app/SpaceSettings/Teams/AddTeams/AddTeamsRouter.es6'
});

export default {
  name: 'teams',
  url: '/teams',
  abstract: true,
  children: [list, add]
};
