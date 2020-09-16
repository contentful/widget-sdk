import PageExtensionRoute from './PageExtensionRoute';
import createPageExtensionBridge from 'widgets/bridges/createPageExtensionBridge';
import * as Navigator from 'states/Navigator';
import * as SlideInNavigator from 'navigation/SlideInNavigator/index';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { createPageExtensionSDK } from 'app/widgets/ExtensionSDKs/createPageExtensionSDK';
import memoize from 'utils/memoize';

export default {
  name: 'pageExtensions',
  url: '/extensions/:extensionId{path:PathSuffix}',
  component: PageExtensionRoute,
  resolve: {
    useNewWidgetRendererInPageLocation: [
      'spaceContext',
      (spaceContext) => {
        return getVariation(FLAGS.NEW_WIDGET_RENDERER_PAGE, {
          spaceId: spaceContext.getId(),
          organizationId: spaceContext.organization.sys.id,
          environmentId: spaceContext.getEnvironmentId(),
        });
      },
    ],
  },
  mapInjectedToProps: [
    '$stateParams',
    'spaceContext',
    'useNewWidgetRendererInPageLocation',
    ($stateParams, spaceContext, useNewWidgetRendererInPageLocation) => {
      const { extensionId, path = '' } = $stateParams;

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
        useNewWidgetRendererInPageLocation,
        // Drilling spaceContext yields an angular "too much recursion" error
        createPageExtensionSDK: memoize(({ widget, parameters }) =>
          createPageExtensionSDK({
            spaceContext,
            widgetNamespace: widget.namespace,
            widgetId: widget.id,
            parameters,
          })
        ),
      };
    },
  ],
};
