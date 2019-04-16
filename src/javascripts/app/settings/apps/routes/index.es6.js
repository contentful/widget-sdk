import { snakeCase } from 'lodash';
import AppsListRoute from './AppsListRoute.es6';
import AppRoute from './AppRoute.es6';
import { getOrgFeature } from 'data/CMA/ProductCatalog.es6';

const hasAppFeature = (orgId, appId) => {
  // Product Catalog Feature ID for an app is a snake-case
  // ID of the app prefixed with "app"
  const featureId = `app_${snakeCase(appId)}`;

  // If the Product Catalog is not available, we allow a user
  // to use the app this time.
  return getOrgFeature(orgId, featureId, true);
};

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
