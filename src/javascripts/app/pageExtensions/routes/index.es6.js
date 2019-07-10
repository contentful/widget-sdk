import PageExtensionRoute from './PageExtensionRoute.es6';
import createPageExtensionBridge from 'widgets/bridges/createPageExtensionBridge.es6';
import * as Navigator from 'states/Navigator.es6';
import TheLocaleStore from 'services/localeStore.es6';

export default {
  name: 'pageExtensions',
  url: '/extensions/:extensionId{path:PathSuffix}',
  component: PageExtensionRoute,
  mapInjectedToProps: [
    '$rootScope',
    '$stateParams',
    'spaceContext',
    'entitySelector',
    ($rootScope, $stateParams, spaceContext, entitySelector) => {
      const { extensionId, path = '' } = $stateParams;
      return {
        extensionId,
        orgId: spaceContext.organization.sys.id,
        extensionLoader: spaceContext.extensionLoader,
        bridge: createPageExtensionBridge(
          {
            $rootScope,
            spaceContext,
            TheLocaleStore,
            Navigator,
            entitySelector
          },
          extensionId
        ),
        path: path.startsWith('/') ? path : '/' + path
      };
    }
  ]
};
