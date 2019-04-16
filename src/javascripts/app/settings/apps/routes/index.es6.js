import AppsListRoute from './AppsListRoute.es6';
import AppRoute from './AppRoute.es6';
import { getOrgFeature } from 'data/CMA/ProductCatalog.es6';

// Product Catalog Feature ID for an app is the ID of the app
// prefixed with "app". If the Product Catalog is not available,
// we allow a user to use the app this time.
const hasAppFeature = (orgId, appId) => getOrgFeature(orgId, `app_${appId}`, true);

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
        ({ organization }, { spaceId }) => ({
          hasAppFeature: appId => hasAppFeature(organization.sys.id, appId),
          spaceId
        })
      ]
    },
    {
      name: 'detail',
      url: '/:appId',
      resolve: {
        isEnabled: [
          'spaceContext',
          '$stateParams',
          ({ organization }, { appId }) => hasAppFeature(organization.sys.id, appId)
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
