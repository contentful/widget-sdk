import AppsListRoute from './AppsListRoute';
import AppRoute from './AppRoute';

export default {
  name: 'appsAlpha',
  url: '/apps_alpha',
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
