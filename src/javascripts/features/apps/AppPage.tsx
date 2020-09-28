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
import { installOrUpdate, uninstall } from './AppOperations';
import UnknownErrorMessage from 'components/shared/UnknownErrorMessage';
import { UninstallModal } from './UninstallModal';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';
import * as AppLifecycleTracking from './AppLifecycleTracking';
import { isUsageExceededErrorResponse, USAGE_EXCEEDED_MESSAGE } from './isUsageExceeded';
import { AppIcon } from './AppIcon';
import { styles } from './AppPageStyles';
import { getMarketplaceDataProvider } from 'widgets/CustomWidgetLoaderInstance';
import {
  WidgetRenderer,
  WidgetLocation,
  Location,
  buildAppDefinitionWidget,
  Widget,
} from '@contentful/widget-renderer';
import { AppExtensionSDK } from 'contentful-ui-extensions-sdk';

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
  app: Record<any, any>;
  appHookBus: AppHookBus;
  cma: any;
  evictWidget: () => void;
  canManageThisApp: boolean;
  spaceData: {
    spaceId: string;
    environmentId: string;
    organizationId: string;
  };
  createSdk: (widget: Widget) => { sdk: AppExtensionSDK; onAppHook: any };
}

interface AppDefinition {
  sys: {
    type: 'AppDefinition';
    id: string;
  };
  name: string;
  src?: string;
  locations?: Location[];
} // TODO: import this from widget-renderer, or CMA

interface State {
  ready: boolean;
  appLoaded: boolean;
  showStillLoadingText: boolean;
  loadingError: boolean;
  title: string;
  appIcon: string;
  appDefinition: AppDefinition | null;
  isInstalled: boolean;
  actionList: any[];
  installationState: InstallationState;
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
    actionList: [],
    installationState: InstallationState.NotBusy,
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

  checkAppStatus = async (appDefinition: AppDefinition | null = this.state.appDefinition) => {
    try {
      return {
        appDefinition,
        // Can throw 404 if the app is not installed yet:
        appInstallation: await this.props.cma.getAppInstallation(appDefinition?.sys?.id),
        isMarketplaceInstallation: false,
      };
    } catch (err) {
      return {
        appDefinition,
        // There is no installation and the app is not private:
        isMarketplaceInstallation: !this.props.app.isPrivateApp,
      };
    }
  };

  hasConfigLocation = (appDefinition?: any) => {
    const definition = appDefinition || this.state.appDefinition;
    const locations = get(definition, ['locations'], []);

    return locations.some(
      (l: { location: WidgetLocation }) => l.location === WidgetLocation.APP_CONFIG
    );
  };

  initialize = async () => {
    const { appHookBus, app } = this.props;
    const { appDefinition } = app;

    const [{ appInstallation }] = await Promise.all([
      this.checkAppStatus(appDefinition),
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
        appLoaded: !this.hasConfigLocation(appDefinition),
        actionList: get(app, ['actionList'], []),
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
    const { cma, evictWidget, appHookBus, app, spaceData } = this.props;

    try {
      await installOrUpdate(cma, evictWidget, this.checkAppStatus, config, spaceData);

      // Verify if installation was completed.
      const { appInstallation } = await this.checkAppStatus();
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
        Notification.error(USAGE_EXCEEDED_MESSAGE);
        AppLifecycleTracking.installationFailed(app.id);
      } else if (this.state.installationState === InstallationState.Update) {
        Notification.error('Failed to update app configuration.');
        AppLifecycleTracking.configurationUpdateFailed(app.id);
      } else {
        Notification.error('Failed to install the app.');
        AppLifecycleTracking.installationFailed(app.id);
      }

      const { appInstallation } = await this.checkAppStatus();
      this.setState({
        isInstalled: !!appInstallation,
        installationState: InstallationState.NotBusy,
      });

      appHookBus.setInstallation(appInstallation);
      appHookBus.emit(APP_EVENTS_OUT.FAILED);
    }
  };

  onAppMisconfigured = async () => {
    const { appInstallation } = await this.checkAppStatus();
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

    if (this.hasConfigLocation()) {
      // The app implements config - hand over control.
      this.props.appHookBus.emit(APP_EVENTS_OUT.STARTED);
    } else {
      // No config location - just use an empty config right away.
      this.onAppConfigured({ config: {} });
    }
  };

  uninstall = () => {
    const { app } = this.props;

    AppLifecycleTracking.uninstallationInitiated(app.id);

    return ModalLauncher.open(({ isShown, onClose }) => (
      <UninstallModal
        key={Date.now()}
        isShown={isShown}
        actionList={this.state.actionList}
        onConfirm={(reasons: string[]) => {
          onClose(true);
          this.uninstallApp(reasons);
        }}
        onClose={() => {
          AppLifecycleTracking.uninstallationCancelled(app.id);
          onClose(true);
        }}
      />
    ));
  };

  uninstallApp = async (reasons: string[]) => {
    const { cma, evictWidget, app } = this.props;

    this.setState({ installationState: InstallationState.Uninstallation });

    // Unset installation immediately so its parameters are not exposed
    // via the SDK as soon as the proces was initiated.
    this.props.appHookBus.setInstallation(null);

    try {
      await uninstall(cma, evictWidget, this.checkAppStatus);

      // Verify if uninstallation was completed.
      const { appInstallation } = await this.checkAppStatus();
      if (appInstallation) {
        throw new Error('AppInstallation still exists.');
      }

      Notification.success('The app was uninstalled successfully.');
      AppLifecycleTracking.uninstalled(app.id, reasons);
    } catch (err) {
      Notification.error('Failed to fully uninstall the app.');
      AppLifecycleTracking.uninstallationFailed(app.id);
    }

    this.props.goBackToList();
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
    return (
      <>
        {!this.props.app.isPrivateApp && this.props.app.documentationLink && (
          <TextLink
            className={styles.documentationLink}
            href={this.props.app.documentationLink.url}
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
            onClick={this.uninstall}
            loading={installationState === InstallationState.Uninstallation}
            className={styles.actionButton}
            disabled={isBusy(installationState)}>
            Uninstall
          </Button>
        )}
        {appLoaded && isInstalled && this.hasConfigLocation() && (
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
      appDefinition as AppDefinition,
      // This should never be null, as we check - as this function is only
      // called once an appDefinition exists
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
              {this.hasConfigLocation()
                ? this.renderConfigLocation()
                : this.renderNoConfigLocation()}
            </ExtensionLocalDevelopmentWarning>
          </div>

          {this.state.appLoaded &&
            this.props.app.appDefinition.public &&
            this.renderFeedbackButton()}
        </Workbench>
      </>
    );
  }
}
