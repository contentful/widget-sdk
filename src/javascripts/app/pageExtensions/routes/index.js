import PageExtensionRoute from './PageExtensionRoute';
import createPageExtensionBridge from 'widgets/bridges/createPageExtensionBridge';
import * as Navigator from 'states/Navigator';
import * as SlideInNavigator from 'navigation/SlideInNavigator/index';
import { getExtensionLoader } from 'app/settings/webhooks/services/ExtensionLoader';

export default {
  name: 'pageExtensions',
  url: '/extensions/:extensionId{path:PathSuffix}',
  component: PageExtensionRoute,
  mapInjectedToProps: [
    '$stateParams',
    'spaceContext',
    ($stateParams, spaceContext) => {
      const { extensionId, path = '' } = $stateParams;
      return {
        extensionId,
        orgId: spaceContext.organization.sys.id,
        extensionLoader: getExtensionLoader(),
        bridge: createPageExtensionBridge(
          {
            spaceContext,
            Navigator,
            SlideInNavigator
          },
          extensionId
        ),
        path: path.startsWith('/') ? path : '/' + path
      };
    }
  ]
};
