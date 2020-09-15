import PageExtensionRoute from './PageExtensionRoute';
import createPageExtensionBridge from 'widgets/bridges/createPageExtensionBridge';
import * as Navigator from 'states/Navigator';
import * as SlideInNavigator from 'navigation/SlideInNavigator/index';
import { WidgetNamespace } from '@contentful/widget-renderer';

export default {
  name: 'pageExtensions',
  url: '/extensions/:extensionId{path:PathSuffix}',
  component: PageExtensionRoute,
  resolve: {
    // TODO: use launch darkly
    useNewWidgetLoaderInPageLocation: [() => Promise.resolve(false)],
  },
  mapInjectedToProps: [
    '$stateParams',
    'spaceContext',
    'useNewWidgetLoaderInPageLocation',
    ($stateParams, spaceContext, useNewWidgetLoaderInPageLocation) => {
      const { extensionId, path = '' } = $stateParams;

      // FIXME: this is causing a "too much recursion" error in angular
      return {
        extensionId,
        orgId: spaceContext.organization.sys.id,
        // TODO: remove me once we remove new widget renderer in app location flag
        bridge: createPageExtensionBridge({
          spaceContext,
          Navigator,
          SlideInNavigator,
          currentWidgetId: extensionId,
          currentWidgetNamespace: WidgetNamespace.EXTENSION,
        }),
        path: path.startsWith('/') ? path : '/' + path,
        useNewWidgetLoaderInPageLocation,
        spaceContext,
      };
    },
  ],
};
