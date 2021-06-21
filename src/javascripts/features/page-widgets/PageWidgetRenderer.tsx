import * as React from 'react';
import {
  Widget,
  WidgetLocation,
  WidgetRenderer,
  WidgetNamespace,
  WidgetLoader,
} from '@contentful/widget-renderer';
import noop from 'lodash/noop';
import { Notification } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import trackExtensionRender from 'widgets/TrackExtensionRender';
import { toLegacyWidget } from 'widgets/WidgetCompat';
import { applyDefaultValues } from 'widgets/WidgetParametersUtils';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { useSpaceEnvContext, useSpaceEnvContentTypes } from 'core/services/SpaceEnvContext';
import {
  isCurrentEnvironmentMaster,
  getEnvironmentAliasesIds,
  getEnvironmentAliasId,
} from 'core/services/SpaceEnvContext/utils';
import { router } from 'core/react-routing';
import { createPageWidgetSDK as localCreatePageWidgetSDK } from 'app/widgets/ExtensionSDKs';
import { usePubSubClient } from 'core/hooks';
import { LoadingState } from 'features/loading-state';
import { MarketplaceApp } from 'features/apps-core';
import { createPageWidgetSDK } from '@contentful/experience-sdk';
import { useCurrentSpaceAPIClient } from '../../core/services/APIClient/useCurrentSpaceAPIClient';
import LocaleStore from 'services/localeStore';
import { FLAGS, useFeatureFlag } from 'core/feature-flags';
import { PageExtensionSDK } from '@contentful/app-sdk';
import {
  createDialogCallbacks,
  createNavigatorCallbacks,
  createSpaceCallbacks,
} from 'app/widgets/ExtensionSDKs/callbacks';
import * as PublicContentType from 'widgets/PublicContentType';
import { getUserWithMinifiedSys } from 'app/widgets/ExtensionSDKs/utils';

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
  const { currentSpaceContentTypes } = useSpaceEnvContentTypes();
  const {
    currentSpace,
    currentSpaceId,
    currentEnvironmentId,
    currentEnvironment,
    currentSpaceData,
  } = useSpaceEnvContext();
  const aliasesIds = getEnvironmentAliasesIds(currentEnvironment);
  const environmentAliasId = getEnvironmentAliasId(currentSpace);
  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);
  const [widget, setWidget] = React.useState<Widget | null>(props.widget ?? null);
  const [app, setApp] = React.useState<MarketplaceApp | undefined>(undefined);
  const { customWidgetPlainClient } = useCurrentSpaceAPIClient();
  const pubSubClient = usePubSubClient();

  const [useExperienceSDK] = useFeatureFlag<boolean>(FLAGS.EXPERIENCE_SDK_PAGE_LOCATION, false);

  const [widgetLoader, setWidgetLoader] = React.useState<WidgetLoader>();
  React.useEffect(() => {
    getCustomWidgetLoader().then(setWidgetLoader);
  }, []);

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
    if (
      !widget ||
      !parameters ||
      !currentSpaceData ||
      !currentSpaceId ||
      !currentEnvironment ||
      !pubSubClient ||
      !customWidgetPlainClient ||
      !widgetLoader ||
      !currentSpace
    )
      return null;

    return useExperienceSDK
      ? (createPageWidgetSDK({
          cma: customWidgetPlainClient,
          widgetId: widget.id,
          widgetNamespace: widget.namespace,
          widgetParameters: widget.parameters,
          space: currentSpaceData,
          widgetLoader,
          user: getUserWithMinifiedSys(),
          contentTypes: currentSpaceContentTypes.map(PublicContentType.fromInternal),
          environment: currentEnvironment,
          locales: {
            activeLocaleCode: LocaleStore.getFocusedLocale().code,
            defaultLocaleCode: LocaleStore.getDefaultLocale().code,
            list: LocaleStore.getLocales(),
          },
          callbacks: {
            space: createSpaceCallbacks({
              pubSubClient,
              cma: customWidgetPlainClient,
              environment: currentEnvironment,
            }),
            dialog: createDialogCallbacks(),
            navigator: createNavigatorCallbacks({
              spaceContext: {
                spaceId: currentSpaceId,
                environmentId: currentEnvironmentId,
                isMaster: isMasterEnvironment,
              },
              widgetRef: {
                widgetId: widget.id,
                widgetNamespace: widget.namespace,
              },
              isOnPageLocation: true,
            }),
          },
          spaceMembership: {
            sys: {
              id: currentSpaceData.spaceMember.sys.id,
            },
            admin: currentSpaceData.spaceMember.admin,
          },
          roles: currentSpaceData.spaceMember.roles.map(({ name, description }) => ({
            name,
            description: description ?? '',
          })),
          invocationParameters: parameters.invocation,
        }) as PageExtensionSDK)
      : localCreatePageWidgetSDK({
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
    currentEnvironment,
    currentSpaceData,
    customWidgetPlainClient,
    useExperienceSDK,
    widgetLoader,
    isMasterEnvironment,
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
      router.navigate({ path: 'error' });
      return;
    }

    // If the url includes the definition, we try to
    // use the human readable slug (which is the app.id)
    // for non private apps
    const hasNicerSlug = !app.isPrivateApp && props.appId === app.appDefinition.sys.id;
    if (hasNicerSlug) {
      // If it has a nicer slug, that is the app.id
      const slug = app.id;

      router.navigate({ path: 'apps.page', appId: slug, pathname: '/' }, { replace: true });

      return;
    }
  }, [app, props.appId, widget]);

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
