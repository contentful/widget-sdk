import JobsListRoute from './JobsListRoute.es6';

export default {
  name: 'jobs',
  url: '/jobs',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      component: JobsListRoute,
      mapInjectedToProps: ['$stateParams', ({ spaceId }) => ({ spaceId })]
    }
  ]
};
