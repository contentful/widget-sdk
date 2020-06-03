import ReleasesListRoute from './ReleasesListRoute';

export default {
  name: 'releases',
  url: '/releases',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      component: ReleasesListRoute,
    },
  ],
};
