import PageExtensionRoute from './PageExtensionRoute';
import createPageExtensionBridge from 'widgets/bridges/createPageExtensionBridge';
import * as Navigator from 'states/Navigator';
import * as SlideInNavigator from 'navigation/SlideInNavigator/index';
import { NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces';

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
        bridge: createPageExtensionBridge({
          spaceContext,
          Navigator,
          SlideInNavigator,
          currentWidgetId: extensionId,
          currentWidgetNamespace: NAMESPACE_EXTENSION,
        }),
        path: path.startsWith('/') ? path : '/' + path,
      };
    },
  ],
};
