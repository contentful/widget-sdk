import PageExtensionRoute from './PageExtensionRoute.es6';
import createPageExtensionBridge from 'widgets/bridges/createPageExtensionBridge.es6';

export default {
  name: 'pageExtensions',
  url: '/extensions/:extensionId*path',
  component: PageExtensionRoute,
  mapInjectedToProps: [
    '$rootScope',
    '$stateParams',
    'spaceContext',
    'TheLocaleStore',
    ($rootScope, $stateParams, spaceContext, TheLocaleStore) => {
      return {
        extensionId: $stateParams.extensionId,
        orgId: spaceContext.organization.sys.id,
        cma: spaceContext.cma,
        bridge: createPageExtensionBridge({ $rootScope, spaceContext, TheLocaleStore }),
        path: $stateParams.path
      };
    }
  ]
};
