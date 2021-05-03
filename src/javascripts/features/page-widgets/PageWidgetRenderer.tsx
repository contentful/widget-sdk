import * as React from 'react';
import {
  Widget,
  WidgetLocation,
  WidgetRenderer,
  WidgetNamespace,
} from '@contentful/widget-renderer';
import noop from 'lodash/noop';
import { Notification } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import trackExtensionRender from 'widgets/TrackExtensionRender';
import { toLegacyWidget } from 'widgets/WidgetCompat';
import { applyDefaultValues } from 'widgets/WidgetParametersUtils';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import {
  isCurrentEnvironmentMaster,
  getEnvironmentAliasesIds,
  getEnvironmentAliasId,
} from 'core/services/SpaceEnvContext/utils';
import { go } from 'states/Navigator';
import { createPageWidgetSDK } from 'app/widgets/ExtensionSDKs';
import { usePubSubClient } from 'core/hooks';
import { LoadingState } from 'features/loading-state';
import { MarketplaceApp } from 'features/apps-core';

interface PageWidgetRendererProps {
  path: string;
  repo: {
    getAppByIdOrSlug: (appId: string) => Promise<MarketplaceApp | undefined>;
  };
  appId?: string;
  widget?: Widget;
}

const styles = {
  root: css({
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    overflowX: 'hidden',
  }),

  loader: css({
    height: '100%',
    '> div': {
      height: '100%',
    },
  }),
};

export const PageWidgetRenderer = (props: PageWidgetRendererProps) => {
  const {
    currentSpace,
    currentSpaceId,
    currentSpaceContentTypes,
    currentEnvironmentId,
    currentEnvironment,
  } = useSpaceEnvContext();
  const aliasesIds = getEnvironmentAliasesIds(currentEnvironment);
  const environmentAliasId = getEnvironmentAliasId(currentSpace);
  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);
  const [widget, setWidget] = React.useState<Widget | null>(props.widget ?? null);
  const [app, setApp] = React.useState<MarketplaceApp | undefined>(undefined);
  const pubSubClient = usePubSubClient();

  const parameters = React.useMemo(() => {
    if (!widget) return null;

    return {
      // No instance parameters for Page Extensions.
      instance: {},
      // Regular installation parameters.
      installation: applyDefaultValues(
        widget.parameters.definitions.installation,
        widget.parameters.values.installation
      ),
      // Current `path` is the only invocation parameter.
      invocation: { path: props.path },
    };
  }, [widget, props.path]);

  const sdk = React.useMemo(() => {
    if (!widget || !parameters || !currentSpaceId || !pubSubClient) return null;

    return createPageWidgetSDK({
      widgetNamespace: widget.namespace,
      widgetId: widget.id,
      parameters,
      spaceId: currentSpaceId,
      contentTypes: currentSpaceContentTypes,
      environmentId: currentEnvironmentId,
      aliasesIds,
      space: currentSpace,
      pubSubClient: pubSubClient,
      environmentAliasId: environmentAliasId ?? null,
    });
  }, [
    aliasesIds,
    currentEnvironmentId,
    currentSpace,
    currentSpaceContentTypes,
    currentSpaceId,
    environmentAliasId,
    parameters,
    pubSubClient,
    widget,
  ]);

  React.useEffect(() => {
    if (!props.appId) return;

    props.repo.getAppByIdOrSlug(props.appId).then(setApp).catch(noop);
  }, [props.repo, props.appId]);

  React.useEffect(() => {
    async function init() {
      if (!app || props.widget) return;

      const loader = await getCustomWidgetLoader();

      loader
        .getOne({
          widgetNamespace: WidgetNamespace.APP,
          widgetId: app.appDefinition.sys.id,
        })
        .then(setWidget);
    }

    init();
  }, [app, props.widget]);

  React.useEffect(() => {
    if (!widget) return;

    trackExtensionRender(WidgetLocation.PAGE, toLegacyWidget(widget), currentEnvironmentId);
  }, [widget, currentEnvironmentId]);

  React.useEffect(() => {
    if (!widget || !app) return;

    const pageLocation = widget.locations.find((l) => l.location === WidgetLocation.PAGE);
    if (!pageLocation) {
      Notification.error('This app has not defined a page location!');
      go({ path: 'error' });
      return;
    }

    // If the url includes the definition, we try to
    // use the human readable slug (which is the app.id)
    // for non private apps
    const hasNicerSlug = !app.isPrivateApp && props.appId === app.appDefinition.sys.id;
    if (hasNicerSlug) {
      // If it has a nicer slug, that is the app.id
      const slug = app.id;
      // Add environment path portion if we're not on master
      const spaceDetailPagePath = !isMasterEnvironment
        ? 'spaces.detail.environment.apps.page'
        : 'spaces.detail.apps.page';

      go({ path: spaceDetailPagePath, params: { appId: slug }, options: { replace: true } });
      return;
    }
  }, [app, props.appId, widget, isMasterEnvironment]);

  if (!widget || !sdk || (props.appId && !app)) {
    return (
      <div className={styles.loader}>
        <LoadingState />
      </div>
    );
  }

  return (
    <div data-test-id="page-extension" className={styles.root}>
      <DocumentTitle title={widget.name} />
      <WidgetRenderer isFullSize location={WidgetLocation.PAGE} sdk={sdk} widget={widget} />
    </div>
  );
};
