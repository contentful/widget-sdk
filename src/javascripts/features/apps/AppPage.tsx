import React, { Component } from 'react';
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
import { APP_EVENTS_IN, APP_EVENTS_OUT, AppHookBus } from 'features/apps-core';
import trackExtensionRender from 'widgets/TrackExtensionRender';
import { toLegacyWidget } from 'widgets/WidgetCompat';
import ExtensionLocalDevelopmentWarning from 'widgets/ExtensionLocalDevelopmentWarning';
import DocumentTitle from 'components/shared/DocumentTitle';
import { AppInstallCallback, AppManager, installOrUpdate } from './AppOperations';
import UnknownErrorMessage from 'components/shared/UnknownErrorMessage';
import * as AppLifecycleTracking from './AppLifecycleTracking';
import { isUsageExceededErrorResponse, getUsageExceededMessage, hasConfigLocation } from './utils';
import { AppIcon } from './AppIcon';
import { styles } from './AppPageStyles';
import { getMarketplaceDataProvider } from 'widgets/CustomWidgetLoaderInstance';
import {
  WidgetRenderer,
  WidgetLocation,
  buildAppDefinitionWidget,
  Widget,
} from '@contentful/widget-renderer';
import { AppExtensionSDK } from 'contentful-ui-extensions-sdk';
import { MarketplaceApp } from 'features/apps-core';

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
  goBackToList: () => void;
  app: MarketplaceApp;
  appHookBus: AppHookBus;
  cma: any;
  evictWidget: AppInstallCallback;
  canManageThisApp: boolean;
  spaceData: {
    spaceId: string;
    environmentId: string;
    organizationId: string;
  };
  createSdk: (widget: Widget) => { sdk: AppExtensionSDK; onAppHook: any };
  hasAdvancedAppsFeature: boolean;
}

interface State {
  ready: boolean;
  appLoaded: boolean;
  showStillLoadingText: boolean;
  loadingError: boolean;
  title: string;
  appIcon: string;
  appDefinition: MarketplaceApp['appDefinition'] | null;
  isInstalled: boolean;
  installationState: InstallationState;
  appManager: AppManager | null;
}

export class AppRoute extends Component<Props, State> {
  state: State = {
    ready: false,
    appLoaded: false,
    showStillLoadingText: false,
    loadingError: false,
    title: get(this.props.app, ['title'], get(this.props.app, ['appDefinition', 'name'])),
    appIcon: get(this.props.app, ['icon'], ''),
    appDefinition: null,
    isInstalled: false,
    installationState: InstallationState.NotBusy,
    appManager: null,
  };

  // There are no parameters in the app location
  parameters = {
    installation: {},
    instance: {},
  };

  async componentDidMount() {
    try {
      await this.initialize();
    } catch (err) {
      Notification.error('Failed to load the app.');
      this.props.goBackToList();
    }
  }

  initialize = async () => {
    const { appHookBus, app, spaceData, cma } = this.props;

    const { environmentId, spaceId, organizationId } = spaceData;
    const appManager = new AppManager(cma, environmentId, spaceId, organizationId);
    this.setState({ appManager });

    const { appDefinition } = app;

    const [{ appInstallation }] = await Promise.all([
      appManager.checkAppStatus(app),
      getMarketplaceDataProvider().prefetch(),
    ]);

    appHookBus.setInstallation(appInstallation);
    appHookBus.on(APP_EVENTS_IN.CONFIGURED, this.onAppConfigured);
    appHookBus.on(APP_EVENTS_IN.MISCONFIGURED, this.onAppMisconfigured);
    appHookBus.on(APP_EVENTS_IN.MARKED_AS_READY, this.onAppMarkedAsReady);

    AppLifecycleTracking.configurationOpened(app.id);

    this.setState(
      {
        ready: true,
        isInstalled: !!appInstallation,
        appDefinition,
        appLoaded: !hasConfigLocation(appDefinition),
      },
      this.afterInitialize
    );
  };

  afterInitialize = () => {
    setTimeout(() => {
      if (!this.state.appLoaded) {
        this.setState({ showStillLoadingText: true });
      }
    }, APP_STILL_LOADING_TIMEOUT);

    setTimeout(() => {
      if (!this.state.appLoaded) {
        this.setState({ loadingError: true });
      }
    }, APP_HAS_ERROR_TIMEOUT);
  };

  onAppConfigured = async ({ config }: { config: any }) => {
    const { cma, evictWidget, appHookBus, app, spaceData, hasAdvancedAppsFeature } = this.props;
    const { appManager } = this.state;

    try {
      await installOrUpdate(app, cma, evictWidget, appManager!.checkAppStatus, config, spaceData);

      // Verify if installation was completed.
      const { appInstallation } = await appManager!.checkAppStatus(app);
      if (!appInstallation) {
        // For whatever reason AppInstallation entity wasn't created.
        throw new Error('AppInstallation does not exist.');
      }

      if (this.state.installationState === InstallationState.Update) {
        Notification.success('App configuration was updated successfully.');
        AppLifecycleTracking.configurationUpdated(app.id);
      } else {
        Notification.success('The app was installed successfully.');
        AppLifecycleTracking.installed(app.id);
      }

      this.setState({ isInstalled: true, installationState: InstallationState.NotBusy });

      appHookBus.setInstallation(appInstallation);
      appHookBus.emit(APP_EVENTS_OUT.SUCCEEDED);
    } catch (err) {
      if (isUsageExceededErrorResponse(err)) {
        Notification.error(getUsageExceededMessage(hasAdvancedAppsFeature));
        AppLifecycleTracking.installationFailed(app.id);
      } else if (this.state.installationState === InstallationState.Update) {
        Notification.error('Failed to update app configuration.');
        AppLifecycleTracking.configurationUpdateFailed(app.id);
      } else {
        Notification.error('Failed to install the app.');
        AppLifecycleTracking.installationFailed(app.id);
      }

      const { appInstallation } = await appManager!.checkAppStatus(app);
      this.setState({
        isInstalled: !!appInstallation,
        installationState: InstallationState.NotBusy,
      });

      appHookBus.setInstallation(appInstallation);
      appHookBus.emit(APP_EVENTS_OUT.FAILED);
    }
  };

  onAppMisconfigured = async () => {
    const { appManager } = this.state;
    const { appInstallation } = await appManager!.checkAppStatus(this.props.app);
    this.setState({ isInstalled: !!appInstallation, installationState: InstallationState.NotBusy });
  };

  onAppMarkedAsReady = () => {
    const { loadingError } = this.state;
    if (!loadingError) {
      this.setState({ appLoaded: true });
    }
  };

  update = (installationState: InstallationState) => {
    this.setState({ installationState });

    if (hasConfigLocation(this.state.appDefinition)) {
      // The app implements config - hand over control.
      this.props.appHookBus.emit(APP_EVENTS_OUT.STARTED);
    } else {
      // No config location - just use an empty config right away.
      this.onAppConfigured({ config: {} });
    }
  };

  uninstall = async (app, evictWidget) => {
    return this.state.appManager!.showUninstallModal(app, async (onClose, reasons: string[]) => {
      onClose(true);
      this.setState({ installationState: InstallationState.Uninstallation });
      // Unset installation immediately so its parameters are not exposed
      // via the SDK as soon as the process was initiated.
      this.props.appHookBus.setInstallation(null);
      await this.state.appManager!.uninstallApp(app, reasons, evictWidget);
      this.props.goBackToList();
    });
  };

  renderBusyOverlay() {
    if (!isBusy(this.state.installationState)) {
      return null;
    }

    return (
      <div className={styles.overlay}>
        <div className={styles.overlayPill}>
          <Paragraph className={styles.busyText}>
            <Spinner size="large" className={styles.spinner} />{' '}
            {InstallationStateToText[this.state.installationState]}
          </Paragraph>
        </div>
      </div>
    );
  }

  renderTitle(Component = Heading) {
    return (
      <Component className={styles.heading}>
        <AppIcon icon={this.state.appIcon} />
        {this.state.title}
        {this.props.app.isEarlyAccess && (
          <Tag tagType="warning" className={styles.earlyAccessTag}>
            EARLY ACCESS
          </Tag>
        )}
        {this.props.app.isPrivateApp && <Tag className={styles.tag}>Private</Tag>}
      </Component>
    );
  }

  renderActions() {
    const { isInstalled, installationState, appLoaded, loadingError } = this.state;
    const { app, evictWidget } = this.props;
    return (
      <>
        {!app.isPrivateApp && app.documentationLink && (
          <TextLink
            className={styles.documentationLink}
            href={app.documentationLink.url}
            target="_blank"
            rel="noopener noreferrer">
            View this app’s documentation
          </TextLink>
        )}
        {appLoaded && !isInstalled && (
          <Button
            buttonType="primary"
            onClick={() => this.update(InstallationState.Installation)}
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
            onClick={() => this.uninstall(app, evictWidget)}
            loading={installationState === InstallationState.Uninstallation}
            className={styles.actionButton}
            disabled={isBusy(installationState)}>
            Uninstall
          </Button>
        )}
        {appLoaded && isInstalled && hasConfigLocation(this.state.appDefinition) && (
          <Button
            buttonType="primary"
            onClick={() => this.update(InstallationState.Update)}
            loading={installationState === InstallationState.Update}
            className={styles.actionButton}
            disabled={isBusy(installationState)}>
            Save
          </Button>
        )}
      </>
    );
  }

  renderContent() {
    const { appDefinition, appLoaded } = this.state;

    const widget = buildAppDefinitionWidget(
      // This should never be null, as we check - as this function is only
      // called once an appDefinition exists
      appDefinition as any,
      getMarketplaceDataProvider()
    );

    const { sdk, onAppHook } = this.props.createSdk(widget);

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

  renderLoading(withoutWorkbench?: boolean) {
    const loadingContent = (
      <Workbench.Content type="text">
        <SkeletonContainer ariaLabel="Loading app..." svgWidth="100%" svgHeight="300px">
          <SkeletonBodyText numberOfLines={5} marginBottom={15} offsetTop={60} />
        </SkeletonContainer>
        {this.state.showStillLoadingText && (
          <Paragraph className={styles.stillLoadingText}>Still loading...</Paragraph>
        )}
      </Workbench.Content>
    );

    if (withoutWorkbench) {
      return loadingContent;
    }

    return (
      <Workbench>
        <Workbench.Header title={this.renderTitle()} onBack={this.props.goBackToList} />
        {loadingContent}
      </Workbench>
    );
  }

  renderLoadingError = () => {
    const { title } = this.state;

    return (
      <UnknownErrorMessage
        buttonText="View all apps"
        description={`The ${title} app cannot be reached or is not responding.`}
        heading="App failed to load"
        onButtonClick={this.props.goBackToList}
      />
    );
  };

  renderConfigLocation() {
    const { appLoaded, loadingError } = this.state;

    return (
      <>
        {loadingError && this.renderLoadingError()}
        {!appLoaded && !loadingError && this.renderLoading(true)}
        {!loadingError && this.renderContent()}
      </>
    );
  }

  renderNoConfigLocation() {
    return (
      <div className={styles.noConfigContainer}>
        <div className={styles.noConfigSection}>
          {this.renderTitle(Subheading)}
          <HelpText className={styles.noConfigHelpText}>
            This app does not require additional configuration.
          </HelpText>
        </div>
        {this.props.canManageThisApp && (
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

  renderFeedbackButton() {
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
        href={`http://ctfl.io/marketplace-app-feedback#appid=${this.props.app.appDefinition.sys.id}`}
        target="_blank"
        rel="noopener noreferrer">
        Give feedback
      </LinkButton>
    );
  }

  render() {
    if (!this.state.ready) {
      return this.renderLoading();
    }

    return (
      <>
        <DocumentTitle title={this.state.title} />
        {this.renderBusyOverlay()}
        <Workbench>
          <Workbench.Header
            onBack={() => {
              this.props.goBackToList();
            }}
            title={this.renderTitle()}
            actions={this.renderActions()}
          />

          <div className={css({ display: 'flex', flexDirection: 'column', width: '100%' })}>
            <ExtensionLocalDevelopmentWarning
              developmentMode={this.props.app.appDefinition.src?.startsWith('http://localhost')}>
              {hasConfigLocation(this.state.appDefinition)
                ? this.renderConfigLocation()
                : this.renderNoConfigLocation()}
            </ExtensionLocalDevelopmentWarning>
          </div>

          {this.state.appLoaded &&
            // "public" property is deprecated
            (this.props.app.appDefinition as any).public &&
            this.renderFeedbackButton()}
        </Workbench>
      </>
    );
  }
}
