import PageExtensionRoute from './PageExtensionRoute.es6';
import createPageExtensionBridge from 'widgets/bridges/createPageExtensionBridge.es6';
import * as Navigator from 'states/Navigator.es6';

export default {
  name: 'pageExtensions',
  url: '/extensions/:extensionId{path:PathSuffix}',
  component: PageExtensionRoute,
  mapInjectedToProps: [
    '$rootScope',
    '$stateParams',
    'spaceContext',
    'TheLocaleStore',
    ($rootScope, $stateParams, spaceContext, TheLocaleStore) => {
      const { extensionId, path = '' } = $stateParams;

      return {
        extensionId,
        orgId: spaceContext.organization.sys.id,
        cma: spaceContext.cma,
        bridge: createPageExtensionBridge(
          {
            $rootScope,
            spaceContext,
            TheLocaleStore,
            Navigator
          },
          extensionId
        ),
        path: path.startsWith('/') ? path : '/' + path
      };
    }
  ]
};
