import AppsListRoute from './AppsListRoute.es6';
import AppRoute from './AppRoute.es6';

export default {
  name: 'apps',
  url: '/apps',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      component: AppsListRoute,
      mapInjectedToProps: ['$stateParams', ({ spaceId }) => ({ spaceId })]
    },
    {
      name: 'detail',
      url: '/:appId',
      component: AppRoute,
      mapInjectedToProps: ['$stateParams', ({ appId, spaceId }) => ({ appId, spaceId })]
    }
  ]
};
