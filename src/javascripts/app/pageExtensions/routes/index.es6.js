import PageExtensionRoute from './PageExtensionRoute.es6';
import createPageExtensionBridge from 'widgets/bridges/createPageExtensionBridge.es6';
import * as Navigator from 'states/Navigator.es6';
import * as SlideInNavigator from 'navigation/SlideInNavigator/index.es6';

export default {
  name: 'pageExtensions',
  url: '/extensions/:extensionId{path:PathSuffix}',
  component: PageExtensionRoute,
  mapInjectedToProps: [
    '$rootScope',
    '$stateParams',
    'spaceContext',
    'entitySelector',
    'entityCreator',
    ($rootScope, $stateParams, spaceContext, entitySelector, entityCreator) => {
      const { extensionId, path = '' } = $stateParams;
      return {
        extensionId,
        orgId: spaceContext.organization.sys.id,
        extensionLoader: spaceContext.extensionLoader,
        bridge: createPageExtensionBridge(
          {
            $rootScope,
            spaceContext,
            Navigator,
            entitySelector,
            entityCreator,
            SlideInNavigator
          },
          extensionId
        ),
        path: path.startsWith('/') ? path : '/' + path
      };
    }
  ]
};
