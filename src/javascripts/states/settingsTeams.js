import { reactStateWrapper } from './utils';

const list = reactStateWrapper({
  name: 'list',
  title: 'Space teams',
  loadingText: 'Loading teams…',
  url: '',
  componentPath: 'app/SpaceSettings/Teams/SpaceTeamsPage'
});

const add = reactStateWrapper({
  name: 'add',
  url: '/add',
  componentPath: 'app/SpaceSettings/Teams/AddTeams/AddTeamsRouter'
});

export default {
  name: 'teams',
  url: '/teams',
  abstract: true,
  children: [list, add]
};
