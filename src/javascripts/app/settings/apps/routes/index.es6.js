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
      mapInjectedToProps: [
        'spaceContext',
        '$stateParams',
        ({ organization }, { spaceId }) => ({ orgId: organization.sys.id, spaceId })
      ]
    },
    {
      name: 'detail',
      url: '/:appId',
      component: AppRoute,
      mapInjectedToProps: [
        'spaceContext',
        '$stateParams',
        ({ organization }, { appId, spaceId }) => ({ orgId: organization.sys.id, appId, spaceId })
      ]
    }
  ]
};
