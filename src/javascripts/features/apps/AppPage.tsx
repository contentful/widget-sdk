import * as React from 'react';
import cx from 'classnames';
import { css } from 'emotion';
import {
  Button,
  Notification,
  Spinner,
  Paragraph,
  Heading,
  Subheading,
  SkeletonContainer,
  SkeletonBodyText,
  Workbench,
  Tag,
  HelpText,
  TextLink,
} from '@contentful/forma-36-react-components';
import { get } from 'lodash';
import { APP_EVENTS_IN } from 'features/apps-core';
import trackExtensionRender from 'widgets/TrackExtensionRender';
import { toLegacyWidget } from 'widgets/WidgetCompat';
import ExtensionLocalDevelopmentWarning from 'widgets/ExtensionLocalDevelopmentWarning';
import DocumentTitle from 'components/shared/DocumentTitle';
import { AppManager, installOrUpdate } from './AppOperations';
import UnknownErrorMessage from 'components/shared/UnknownErrorMessage';
import * as AppLifecycleTracking from './AppLifecycleTracking';
import { isUsageExceededErrorResponse, getUsageExceededMessage, hasConfigLocation } from './utils';
import { AppIcon } from './AppIcon';
import { styles } from './AppPageStyles';
import {
  getMarketplaceDataProvider,
  getCustomWidgetLoader,
} from 'widgets/CustomWidgetLoaderInstance';
import {
  WidgetRenderer,
  WidgetLocation,
  buildAppDefinitionWidget,
  WidgetNamespace,
  WidgetLoader,
  AppStages,
} from '@contentful/widget-renderer';
import { MarketplaceApp } from 'features/apps-core';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { useSpaceEnvContentTypes } from 'core/services/SpaceEnvContext';
import { isOwnerOrAdmin, isDeveloper } from 'services/OrganizationRoles';
import { isCurrentEnvironmentMaster } from 'core/services/SpaceEnvContext/utils';
import { createAppExtensionSDK as localCreateAppConfigWidgetSDK } from 'app/widgets/ExtensionSDKs';
import { getUserWithMinifiedSys } from 'app/widgets/ExtensionSDKs/utils';
import { useCurrentSpaceAPIClient } from 'core/services/APIClient/useCurrentSpaceAPIClient';
import { usePubSubClient } from 'core/hooks';
import LocaleStore from 'services/localeStore';
import { getSpaceContext } from 'classes/spaceContext';
import { useRouteNavigate } from 'core/react-routing';
import { FLAGS } from 'core/feature-flags';
import { useFeatureFlag } from 'core/feature-flags';
import {
  createAppConfigWidgetSDK,
  AppInstallationEvents,
  AppHookBus,
} from '@contentful/experience-sdk';
import {
  createDialogCallbacks,
  createNavigatorCallbacks,
  createSpaceCallbacks,
} from 'app/widgets/ExtensionSDKs/callbacks';
import { GlobalEventBus, GlobalEvents } from 'core/services/GlobalEventsBus';
import * as PublicContentType from 'widgets/PublicContentType';

enum InstallationState {
  Installation = 'installation',
  Update = 'update',
  Uninstallation = 'uninstallation',
  NotBusy = 'not_busy',
}

const isBusy = (installationState: InstallationState) =>
  installationState !== InstallationState.NotBusy;

const InstallationStateToText = {
  [InstallationState.Installation]: 'Installing the app...',
  [InstallationState.Update]: 'Updating configuration...',
  [InstallationState.Uninstallation]: 'Uninstalling the app...',
};

const APP_STILL_LOADING_TIMEOUT = 3000;
const APP_HAS_ERROR_TIMEOUT = 15000;

interface Props {
  appId: string;
  repo: {
    getAppByIdOrSlug: (appId: string) => Promise<MarketplaceApp>;
  };
  appHookBus: AppHookBus;
  hasAdvancedAppsFeature: boolean;
  hasAppsFeature: boolean;
  canManageApps: boolean;
  acceptedPermissions: string | null;
}

export function AppRoute(props: Props) {
  const routeNavigate = useRouteNavigate();
  const [app, setApp] = React.useState<MarketplaceApp | null>(null);
  const [ready, setReady] = React.useState(false);
  const [appLoaded, setAppLoaded] = React.useState(false);
  const [showStillLoadingText, setShowStillLoadingText] = React.useState(false);
  const [loadingError, setLoadingError] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [installationState, setInstallationState] = React.useState<InstallationState>(
    InstallationState.NotBusy
  );
  const [widgetLoader, setWidgetLoader] = React.useState<WidgetLoader | null>(null);
  React.useEffect(() => {
    getCustomWidgetLoader().then(setWidgetLoader);
  }, []);
  const pubSubClient = usePubSubClient();
  const installationStateRef = React.useRef<InstallationState>(installationState); // TODO: useEffect creates a snapshot of `installationState` where `onAppConfigured` receives a outdated value, we use useRef to bypass this
  const { customWidgetClient, customWidgetPlainClient, client: cma } = useCurrentSpaceAPIClient();
  const { currentSpaceContentTypes } = useSpaceEnvContentTypes();

  const {
    currentOrganization: organization,
    currentOrganizationId: organizationId,
    currentSpace,
    currentSpaceId: spaceId,
    currentEnvironment,
    currentEnvironmentId: environmentId,
    currentSpaceData,
  } = useSpaceEnvContext();
  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);
  const appManager = React.useMemo<AppManager>(
    () => new AppManager(cma, environmentId, spaceId, organizationId),
    [cma, environmentId, spaceId, organizationId]
  );
  const canManageThisApp = React.useMemo(() => {
    if (!app || !organizationId || !organization) return false;

    const sameOrg = organizationId === app.appDefinition.sys.organization.sys.id;
    const isDeveloperOrHigher = isOwnerOrAdmin(organization) || isDeveloper(organization);
    return sameOrg && isDeveloperOrHigher;
  }, [app, organizationId, organization]);

  const widget = React.useMemo(() => {
    if (!app) return null;

    return buildAppDefinitionWidget(
      // This should never be null, as we check - as this function is only
      // called once an appDefinition exists
      app.appDefinition as any,
      getMarketplaceDataProvider()
    );
  }, [app]);

  const [useExperienceSDK] = useFeatureFlag<boolean>(
    FLAGS.EXPERIENCE_SDK_APP_CONFIG_LOCATION,
    false
  );
  const onAppMarkedAsReady = React.useCallback(async () => {
    if (!loadingError) {
      setAppLoaded(true);
    }
  }, [loadingError, setAppLoaded]);

  const goBackToList = React.useCallback(() => {
    return routeNavigate({ path: 'apps.list' });
  }, [routeNavigate]);

  const sdkInstance = React.useMemo(() => {
    if (!widget || !app || !customWidgetClient || !spaceId) return null;

    const spaceContext = getSpaceContext();

    if (
      useExperienceSDK &&
      widgetLoader &&
      currentEnvironment &&
      currentSpaceData &&
      pubSubClient &&
      customWidgetPlainClient
    ) {
      return {
        sdk: createAppConfigWidgetSDK({
          widgetLoader,
          locales: {
            activeLocaleCode: LocaleStore.getFocusedLocale().code,
            defaultLocaleCode: LocaleStore.getDefaultLocale().code,
            list: LocaleStore.getLocales(),
          },
          contentTypes: currentSpaceContentTypes.map(PublicContentType.fromInternal),
          cma: customWidgetPlainClient,
          user: getUserWithMinifiedSys(),
          environment: currentEnvironment,
          space: currentSpaceData,
          widgetId: widget.id,
          widgetNamespace: WidgetNamespace.APP,
          appHookBus: props.appHookBus,
          callbacks: {
            navigator: createNavigatorCallbacks({
              spaceContext: {
                environmentId,
                spaceId,
                isMaster: isMasterEnvironment,
              },
              widgetRef: {
                widgetId: widget.id,
                widgetNamespace: WidgetNamespace.APP,
              },
            }),
            dialog: createDialogCallbacks(),
            app: {
              setReady: onAppMarkedAsReady,
              refreshPublishedContentTypes() {
                GlobalEventBus.emit(GlobalEvents.RefreshPublishedContentTypes);
              },
            },
            space: createSpaceCallbacks({
              pubSubClient,
              environment: currentEnvironment,
              cma: customWidgetPlainClient,
            }),
          },
        }),
        onAppHook: (stage: AppStages, result: any) => {
          if (stage !== AppStages.PreInstall) {
            // We only handle results of pre install hooks, abort.
            return;
          }

          if (result === false) {
            props.appHookBus.emit(APP_EVENTS_IN.MISCONFIGURED);
          } else {
            props.appHookBus.emit(APP_EVENTS_IN.CONFIGURED, { config: result });
          }
        },
      };
    } else {
      return localCreateAppConfigWidgetSDK({
        spaceContext,
        cma: customWidgetClient,
        widgetNamespace: WidgetNamespace.APP,
        widgetId: app.appDefinition.sys.id,
        appHookBus: props.appHookBus,
        currentAppWidget: widget,
      });
    }
  }, [
    widget,
    app,
    environmentId,
    currentEnvironment,
    isMasterEnvironment,
    spaceId,
    customWidgetClient,
    props.appHookBus,
    useExperienceSDK,
    widgetLoader,
    customWidgetPlainClient,
    onAppMarkedAsReady,
    pubSubClient,
    currentSpaceContentTypes,
    currentSpaceData,
  ]);

  const title: string = get(app, ['title'], get(app, ['appDefinition', 'name']));
  const appIcon: string = get(app, ['icon'], '');

  React.useEffect(() => {
    installationStateRef.current = installationState;
  }, [installationState]);

  React.useEffect(() => {
    if (!props.repo || !props.appId) return;

    props.repo
      .getAppByIdOrSlug(props.appId)
      .then(setApp)
      .catch(() => {
        Notification.error('Failed to load the app.');
        goBackToList();
      });
  }, [props.repo, props.appId, goBackToList]);

  React.useEffect(() => {
    if (!app) return;

    setAppLoaded(!hasConfigLocation(app.appDefinition));
    AppLifecycleTracking.configurationOpened(app.id);
  }, [app]);

  React.useEffect(() => {
    async function initialize() {
      if (!app || !appManager) return;

      try {
        const [{ appInstallation }] = await Promise.all([
          appManager.checkAppStatus(app),
          getMarketplaceDataProvider().prefetch(),
        ]);

        props.appHookBus.setInstallation(appInstallation);
        props.appHookBus.on(APP_EVENTS_IN.CONFIGURED, onAppConfigured);
        props.appHookBus.on(APP_EVENTS_IN.MISCONFIGURED, onAppMisconfigured);
        props.appHookBus.on(APP_EVENTS_IN.MARKED_AS_READY, onAppMarkedAsReady);

        setIsInstalled(!!appInstallation);
        setReady(true);
      } catch (err) {
        Notification.error('Failed to load the app.');
        goBackToList();
      }
    }

    initialize();
  }, [app, appManager]); // eslint-disable-line

  React.useEffect(() => {
    if (appLoaded) return;

    const loadingTextTimeout = setTimeout(() => {
      setShowStillLoadingText(true);
    }, APP_STILL_LOADING_TIMEOUT);

    const loadingErrorTimeout = setTimeout(() => {
      setLoadingError(true);
    }, APP_HAS_ERROR_TIMEOUT);

    return () => {
      clearTimeout(loadingTextTimeout);
      clearTimeout(loadingErrorTimeout);
    };
  }, [appLoaded]);

  React.useEffect(() => {
    if (!spaceId || !app) return;

    // When entering the route after a page refresh
    // the current state won't be initialized. For this reason
    // we need to compute params and an absolute path manually.
    const params: { spaceId: string; app?: string; environmentId?: string } = {
      spaceId: spaceId,
    };
    if (!isMasterEnvironment) {
      params.environmentId = environmentId;
    }

    // No need to consent for private apps.
    if (app.isPrivateApp) {
      if (!props.canManageApps) {
        // redirect users without management permissions to the app list
        routeNavigate({ path: 'apps.list', ...params });
        return;
      }
      // Otherwise allow to continue page rendering.
      return;
    }

    // If an app is not installed and permissions were not accepted
    // we display the app dialog so consent can be given.
    const installingWithoutConsent = !app.appInstallation && !props.acceptedPermissions;

    if (!props.canManageApps || !props.hasAppsFeature || installingWithoutConsent) {
      if (props.hasAppsFeature) {
        // Passing this param will open the app dialog.
        params.app = app.id;
      }

      routeNavigate({ path: 'apps.list', ...params });
    }
  }, [
    spaceId,
    isMasterEnvironment,
    app,
    environmentId,
    props.hasAppsFeature,
    props.acceptedPermissions,
    props.canManageApps,
    routeNavigate,
  ]);

  async function evictWidget(appInstallation) {
    const loader = await getCustomWidgetLoader();

    loader.evict({
      widgetNamespace: WidgetNamespace.APP,
      widgetId: get(appInstallation, ['sys', 'appDefinition', 'sys', 'id']),
    });
  }

  async function onAppConfigured({ config }: { config: any }) {
    if (!appManager || !app || !cma) return;

    try {
      const spaceData = {
        spaceId,
        environmentId,
        organizationId,
      };
      await installOrUpdate(app, cma, evictWidget, appManager.checkAppStatus, config, spaceData);

      // Verify if installation was completed.
      const { appInstallation } = await appManager.checkAppStatus(app);
      if (!appInstallation) {
        // For whatever reason AppInstallation entity wasn't created.
        throw new Error('AppInstallation does not exist.');
      }

      if (installationStateRef.current === InstallationState.Update) {
        Notification.success('App configuration was updated successfully.');
        AppLifecycleTracking.configurationUpdated(app.id);
      } else {
        Notification.success('The app was installed successfully.');
        AppLifecycleTracking.installed(app.id);
      }

      setIsInstalled(true);
      setInstallationState(InstallationState.NotBusy);

      props.appHookBus.setInstallation(appInstallation);
      props.appHookBus.emit(AppInstallationEvents.SUCCEEDED);
    } catch (err) {
      if (isUsageExceededErrorResponse(err)) {
        Notification.error(getUsageExceededMessage(props.hasAdvancedAppsFeature));
        AppLifecycleTracking.installationFailed(app.id);
      } else if (installationStateRef.current === InstallationState.Update) {
        Notification.error('Failed to update app configuration.');
        AppLifecycleTracking.configurationUpdateFailed(app.id);
      } else {
        Notification.error('Failed to install the app.');
        AppLifecycleTracking.installationFailed(app.id);
      }

      const { appInstallation } = await appManager.checkAppStatus(app);
      setIsInstalled(!!appInstallation);
      setInstallationState(InstallationState.NotBusy);

      props.appHookBus.setInstallation(appInstallation);
      props.appHookBus.emit(AppInstallationEvents.FAILED);
    }
  }

  async function onAppMisconfigured() {
    if (!appManager || !app) return;

    const { appInstallation } = await appManager.checkAppStatus(app);
    setIsInstalled(!!appInstallation);
    setInstallationState(InstallationState.NotBusy);
  }

  function update(installationState: InstallationState) {
    if (!app || !appManager) return;

    setInstallationState(installationState);

    if (hasConfigLocation(app.appDefinition)) {
      // The app implements config - hand over control.
      props.appHookBus.emit(AppInstallationEvents.STARTED);
    } else {
      // No config location - just use an empty config right away.
      onAppConfigured({ config: {} });
    }
  }

  async function uninstall(app, evictWidget) {
    if (!app || !appManager) return;

    return appManager.showUninstallModal(app, async (onClose, reasons: string[]) => {
      onClose(true);
      setInstallationState(InstallationState.Uninstallation);
      // Unset installation immediately so its parameters are not exposed
      // via the SDK as soon as the process was initiated.
      props.appHookBus.setInstallation(null);
      await appManager.uninstallApp(app, reasons, evictWidget);
      goBackToList();
    });
  }

  function renderBusyOverlay() {
    if (!isBusy(installationState)) {
      return null;
    }

    return (
      <div className={styles.overlay}>
        <div className={styles.overlayPill}>
          <Paragraph className={styles.busyText}>
            <Spinner size="large" className={styles.spinner} />{' '}
            {InstallationStateToText[installationState]}
          </Paragraph>
        </div>
      </div>
    );
  }

  function renderTitle(Component = Heading) {
    return (
      <Component className={styles.heading}>
        <AppIcon icon={appIcon} />
        {title}
        {app?.isEarlyAccess && (
          <Tag tagType="warning" className={styles.earlyAccessTag}>
            EARLY ACCESS
          </Tag>
        )}
        {app?.isPrivateApp && <Tag className={styles.tag}>Private</Tag>}
      </Component>
    );
  }

  function renderActions() {
    return (
      <>
        {!app?.isPrivateApp && app?.documentationLink && (
          <TextLink
            className={styles.documentationLink}
            href={app?.documentationLink.url}
            target="_blank"
            rel="noopener noreferrer">
            View this app’s documentation
          </TextLink>
        )}
        {appLoaded && !isInstalled && (
          <Button
            buttonType="primary"
            onClick={() => update(InstallationState.Installation)}
            loading={installationState === InstallationState.Installation}
            className={styles.actionButton}
            disabled={isBusy(installationState)}>
            Install
          </Button>
        )}
        {(appLoaded || loadingError) && isInstalled && (
          <Button
            testId={'app-uninstall-button'}
            buttonType="muted"
            onClick={() => uninstall(app, evictWidget)}
            loading={installationState === InstallationState.Uninstallation}
            className={styles.actionButton}
            disabled={isBusy(installationState)}>
            Uninstall
          </Button>
        )}
        {appLoaded && isInstalled && hasConfigLocation(app?.appDefinition) && (
          <Button
            buttonType="primary"
            onClick={() => update(InstallationState.Update)}
            loading={installationState === InstallationState.Update}
            className={styles.actionButton}
            disabled={isBusy(installationState)}>
            Save
          </Button>
        )}
      </>
    );
  }

  function renderContent() {
    if (!sdkInstance || !widget) return null;

    const { sdk, onAppHook } = sdkInstance;

    return (
      <Workbench.Content
        type="full"
        className={cx(styles.renderer, { [styles.hideRenderer]: !appLoaded })}>
        <WidgetRenderer
          isFullSize
          location={WidgetLocation.APP_CONFIG}
          sdk={sdk}
          widget={widget}
          onAppHook={onAppHook}
          onRender={(widget, location) =>
            trackExtensionRender(location, toLegacyWidget(widget), sdk.ids.environment)
          }
        />
      </Workbench.Content>
    );
  }

  function renderLoading(withoutWorkbench?: boolean) {
    const loadingContent = (
      <Workbench.Content type="text">
        <SkeletonContainer ariaLabel="Loading app..." svgWidth="100%" svgHeight="300px">
          <SkeletonBodyText numberOfLines={5} marginBottom={15} offsetTop={60} />
        </SkeletonContainer>
        {showStillLoadingText && (
          <Paragraph className={styles.stillLoadingText}>Still loading...</Paragraph>
        )}
      </Workbench.Content>
    );

    if (withoutWorkbench) {
      return loadingContent;
    }

    return (
      <Workbench>
        <Workbench.Header title={renderTitle()} onBack={goBackToList} />
        {loadingContent}
      </Workbench>
    );
  }

  function renderLoadingError() {
    return (
      <UnknownErrorMessage
        buttonText="View all apps"
        description={`The ${title} app cannot be reached or is not responding.`}
        heading="App failed to load"
        onButtonClick={goBackToList}
      />
    );
  }

  function renderConfigLocation() {
    return (
      <>
        {loadingError && renderLoadingError()}
        {!appLoaded && !loadingError && renderLoading(true)}
        {!loadingError && renderContent()}
      </>
    );
  }

  function renderNoConfigLocation() {
    return (
      <div className={styles.noConfigContainer}>
        <div className={styles.noConfigSection}>
          {renderTitle(Subheading)}
          <HelpText className={styles.noConfigHelpText}>
            This app does not require additional configuration.
          </HelpText>
        </div>
        {canManageThisApp && (
          <>
            <div className={styles.divider} />
            <div className={styles.noConfigSection}>
              <Paragraph>
                This is the default configuration screen of your app. Build advanced installation
                flows for your users by adding the app configuration location. Learn more about{' '}
                <TextLink
                  href="https://www.contentful.com/developers/docs/extensibility/app-framework/locations/"
                  rel="noopener noreferrer"
                  target="_blank"
                  icon="ExternalLink"
                  iconPosition="right">
                  app locations
                </TextLink>
              </Paragraph>
            </div>
          </>
        )}
      </div>
    );
  }

  function renderFeedbackButton() {
    // Partial because Button's defaultProps are not optional
    // ButtonProps is missing target and rel prop
    const LinkButton = Button as React.ComponentType<
      Partial<React.ComponentPropsWithoutRef<typeof Button>> &
        React.AnchorHTMLAttributes<HTMLAnchorElement>
    >;
    return (
      <LinkButton
        buttonType="naked"
        icon="ChatBubble"
        className={styles.feedbackButton}
        href={`http://ctfl.io/marketplace-app-feedback#appid=${app?.appDefinition.sys.id}`}
        target="_blank"
        rel="noopener noreferrer">
        Give feedback
      </LinkButton>
    );
  }

  if (!ready) {
    return renderLoading();
  }

  return (
    <>
      <DocumentTitle title={title} />
      {renderBusyOverlay()}
      <Workbench>
        <Workbench.Header onBack={goBackToList} title={renderTitle()} actions={renderActions()} />

        <div className={css({ display: 'flex', flexDirection: 'column', width: '100%' })}>
          <ExtensionLocalDevelopmentWarning
            developmentMode={app?.appDefinition.src?.startsWith('http://localhost')}>
            {hasConfigLocation(app?.appDefinition)
              ? renderConfigLocation()
              : renderNoConfigLocation()}
          </ExtensionLocalDevelopmentWarning>
        </div>

        {appLoaded &&
          // "public" property is deprecated
          (app?.appDefinition as any).public &&
          renderFeedbackButton()}
      </Workbench>
    </>
  );
}
