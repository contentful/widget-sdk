import AppsListRoute from './AppsListRoute.es6';
import AppRoute from './AppRoute.es6';
import { getOrgFeature } from 'data/CMA/ProductCatalog.es6';

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
      resolve: {
        isEnabled: [
          'spaceContext',
          '$stateParams',
          ({ organization }, { appId }) => {
            return getOrgFeature(organization.sys.id, appId, true);
          }
        ]
      },
      component: AppRoute,
      mapInjectedToProps: [
        'isEnabled',
        '$stateParams',
        (isEnabled, { appId, spaceId }) => ({ isEnabled, appId, spaceId })
      ]
    }
  ]
};
