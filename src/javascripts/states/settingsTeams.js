import SpaceTeamsPage from 'app/SpaceSettings/Teams/SpaceTeamsPage';
import AddTeamsRouter from 'app/SpaceSettings/Teams/AddTeams/AddTeamsRouter';

const list = {
  name: 'list',
  url: '',
  component: SpaceTeamsPage
};

const add = {
  name: 'add',
  url: '/add',
  component: AddTeamsRouter,
  mapInjectedToProps: [
    '$stateParams',
    $stateParams => ({
      spaceId: $stateParams.spaceId
    })
  ]
};

export default {
  name: 'teams',
  url: '/teams',
  abstract: true,
  children: [list, add]
};
