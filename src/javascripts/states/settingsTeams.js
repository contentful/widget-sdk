import { reactStateWrapper } from './utils';
import SpaceTeamsPage from 'app/SpaceSettings/Teams/SpaceTeamsPage';
import AddTeamsRouter from 'app/SpaceSettings/Teams/AddTeams/AddTeamsRouter';

const list = reactStateWrapper({
  name: 'list',
  title: 'Space teams',
  loadingText: 'Loading teams…',
  url: '',
  component: SpaceTeamsPage
});

const add = reactStateWrapper({
  name: 'add',
  url: '/add',
  component: AddTeamsRouter
});

export default {
  name: 'teams',
  url: '/teams',
  abstract: true,
  children: [list, add]
};
