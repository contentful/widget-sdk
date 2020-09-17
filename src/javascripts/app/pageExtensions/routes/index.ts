import { memoize } from 'lodash';
import PageExtensionRoute from './PageExtensionRoute';
import createPageExtensionBridge from 'widgets/bridges/createPageExtensionBridge';
import * as Navigator from 'states/Navigator';
import * as SlideInNavigator from 'navigation/SlideInNavigator/index';
import { Widget, WidgetNamespace } from '@contentful/widget-renderer';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { createPageWidgetSDK } from 'app/widgets/ExtensionSDKs/createPageWidgetSDK';
import { PageWidgetParameters } from 'features/apps';

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
        createPageExtensionBridge: memoize(() =>
          createPageExtensionBridge({
            spaceContext,
            Navigator,
            SlideInNavigator,
            currentWidgetId: extensionId,
            currentWidgetNamespace: WidgetNamespace.EXTENSION,
          })
        ),
        path: path.startsWith('/') ? path : `/${path}`,
        useNewWidgetRendererInPageLocation,
        environmentId: spaceContext.getEnvironmentId(),
        createPageExtensionSDK: memoize((widget: Widget, parameters: PageWidgetParameters) =>
          createPageWidgetSDK({
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
