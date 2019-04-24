import AppsListRoute from './AppsListRoute.es6';
import AppRoute from './AppRoute.es6';
import { getSpaceFeature } from 'data/CMA/ProductCatalog.es6';

export default {
  name: 'apps',
  url: '/apps',
  abstract: true,
  resolve: {
    hasBasicApps: [
      'spaceContext',
      spaceContext => {
        // If we cannot contact Product Catalog, give apps away
        // for free (3rd arg set to to `true`) this time.
        return getSpaceFeature(spaceContext.getId(), 'basic_apps', true);
      }
    ]
  },
  children: [
    {
      name: 'list',
      url: '',
      component: AppsListRoute,
      mapInjectedToProps: [
        'hasBasicApps',
        '$stateParams',
        (hasBasicApps, { spaceId }) => ({ hasBasicApps, spaceId })
      ]
    },
    {
      name: 'detail',
      url: '/:appId',
      component: AppRoute,
      mapInjectedToProps: [
        'hasBasicApps',
        '$stateParams',
        (hasBasicApps, { appId, spaceId }) => ({ hasBasicApps, appId, spaceId })
      ]
    }
  ]
};
