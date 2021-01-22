import { memoize } from 'lodash';
import PageExtensionRoute from './PageExtensionRoute';
import { Widget } from '@contentful/widget-renderer';
import { createPageWidgetSDK } from 'app/widgets/ExtensionSDKs/createPageWidgetSDK';
import { PageWidgetParameters } from 'features/apps';
import { getSpaceContext } from 'classes/spaceContext';

export default {
  name: 'pageExtensions',
  url: '/extensions/:extensionId{path:PathSuffix}',
  component: PageExtensionRoute,
  mapInjectedToProps: [
    '$stateParams',
    ($stateParams) => {
      const spaceContext = getSpaceContext();
      const { extensionId, path = '' } = $stateParams;

      return {
        extensionId,
        orgId: spaceContext.organization.sys.id,
        path: path.startsWith('/') ? path : `/${path}`,
        environmentId: spaceContext.getEnvironmentId(),
        createPageExtensionSDK: memoize((widget: Widget, parameters: PageWidgetParameters) =>
          createPageWidgetSDK({
            widgetNamespace: widget.namespace,
            widgetId: widget.id,
            parameters,
            spaceId: spaceContext.getId(),
            contentTypes: spaceContext.publishedCTs.getAllBare(),
            environmentId: spaceContext.getEnvironmentId(),
            aliasesIds: spaceContext.getAliasesIds(),
            space: spaceContext.space,
            pubSubClient: spaceContext.pubsubClient,
            environmentAliasId: spaceContext.getAliasId(),
          })
        ),
      };
    },
  ],
};
