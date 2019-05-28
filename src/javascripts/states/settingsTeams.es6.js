import base from 'states/Base.es6';

const list = base({
  name: 'list',
  url: '',
  loadingText: 'Loading teams…',
  template: '<react-component name="access_control/SpaceTeamsPage.es6" />'
});

export default {
  name: 'teams',
  url: '/teams',
  abstract: true,
  children: [list]
};
