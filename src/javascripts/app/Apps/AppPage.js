import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { css, keyframes } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  Button,
  Notification,
  Spinner,
  Paragraph,
  Heading,
  SkeletonContainer,
  SkeletonBodyText
} from '@contentful/forma-36-react-components';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import { get } from 'lodash';

import StateRedirect from 'app/common/StateRedirect';
import ExtensionIFrameRenderer from 'widgets/ExtensionIFrameRenderer';
import { buildAppDefinitionWidget } from 'widgets/WidgetTypes';
import DocumentTitle from 'components/shared/DocumentTitle';
import EmptyStateContainer, {
  defaultSVGStyle
} from 'components/EmptyStateContainer/EmptyStateContainer';
import EmptyStateIllustration from 'svg/connected-forms-illustration.svg';
import { installOrUpdate, uninstall } from './AppOperations';
import { APP_EVENTS_IN, APP_EVENTS_OUT } from './AppHookBus';
import UnknownErrorMessage from 'components/shared/UnknownErrorMessage';
import UninstallModal from './UninstallModal';
import ModalLauncher from 'app/common/ModalLauncher';
import * as AppLifecycleTracking from './AppLifecycleTracking';

import { websiteUrl } from 'Config';
import { getSectionVisibility } from 'access_control/AccessChecker';

const BUSY_STATE_INSTALLATION = 'installation';
const BUSY_STATE_UPDATE = 'update';
const BUSY_STATE_UNINSTALLATION = 'uninstallation';

const BUSY_STATE_TO_TEXT = {
  [BUSY_STATE_INSTALLATION]: 'Installing the app...',
  [BUSY_STATE_UPDATE]: 'Updating configuration...',
  [BUSY_STATE_UNINSTALLATION]: 'Uninstalling the app...'
};

const APP_STILL_LOADING_TIMEOUT = 3000;
const APP_HAS_ERROR_TIMEOUT = 15000;

const fadeIn = keyframes({
  from: {
    transform: 'translateY(50px)',
    opacity: '0'
  },
  to: {
    transform: 'translateY(0)',
    opacity: '1'
  }
});

const styles = {
  renderer: css({
    padding: 0,
    animation: `${fadeIn} 0.8s ease`,
    '> div': {
      height: '100%',
      width: '100%'
    },
    overflow: 'hidden'
  }),
  hideRenderer: css({
    display: 'none'
  }),
  actionButton: css({
    marginLeft: tokens.spacingM
  }),
  overlay: css({
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    position: 'fixed',
    zIndex: 9999,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center'
  }),
  busyText: css({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '50px',
    fontSize: '24px',
    backgroundColor: 'white',
    letterSpacing: '1px'
  }),
  overlayPill: css({
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }),
  spinner: css({
    marginRight: tokens.spacingS
  }),
  appIcon: css({
    marginRight: tokens.spacingXs,
    verticalAlign: 'middle'
  }),
  icon: css({
    width: '45px',
    height: '45px',
    verticalAlign: 'middle',
    marginRight: tokens.spacingS
  }),
  stillLoadingText: css({
    marginTop: '-80px'
  })
};

export default class AppRoute extends Component {
  static propTypes = {
    goBackToList: PropTypes.func.isRequired,
    app: PropTypes.object.isRequired,
    productCatalog: PropTypes.shape({
      isAppEnabled: PropTypes.func.isRequired
    }),
    bridge: PropTypes.object.isRequired,
    appHookBus: PropTypes.shape({
      on: PropTypes.func.isRequired,
      emit: PropTypes.func.isRequired,
      setInstallation: PropTypes.func.isRequired
    }).isRequired,
    cma: PropTypes.shape({
      getAppInstallation: PropTypes.func.isRequired
    }).isRequired,
    evictWidget: PropTypes.func.isRequired
  };

  state = {
    ready: false,
    appLoaded: false,
    showStillLoadingText: false,
    loadingError: false,
    title: get(this.props.app, ['title'], get(this.props.app, ['appDefinition', 'name'])),
    appIcon: get(this.props.app, ['icon'], '')
  };

  // There are no parameters in the app location
  parameters = {
    installation: {},
    instance: {}
  };

  async componentDidMount() {
    try {
      await this.initialize();
    } catch (err) {
      Notification.error('Failed to load the app.');
      this.props.goBackToList();
    }
  }

  checkAppStatus = async (appDefinition = this.state.appDefinition) => {
    try {
      return {
        appDefinition,
        // Can throw 404 if the app is not installed yet:
        appInstallation: await this.props.cma.getAppInstallation(appDefinition.sys.id)
      };
    } catch (err) {
      return { appDefinition };
    }
  };

  initialize = async () => {
    const { appHookBus, app, productCatalog } = this.props;
    const { appDefinition } = app;

    const [{ appInstallation }, appEnabled] = await Promise.all([
      this.checkAppStatus(appDefinition),
      productCatalog.isAppEnabled(appDefinition)
    ]);

    appHookBus.setInstallation(appInstallation);
    appHookBus.on(APP_EVENTS_IN.CONFIGURED, this.onAppConfigured);
    appHookBus.on(APP_EVENTS_IN.MISCONFIGURED, this.onAppMisconfigured);
    appHookBus.on(APP_EVENTS_IN.MARKED_AS_READY, this.onAppMarkedAsReady);

    AppLifecycleTracking.configurationOpened(app.id);

    this.setState(
      {
        ready: true,
        appEnabled,
        isInstalled: !!appInstallation,
        appDefinition,
        actionList: get(app, ['actionList'], [])
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

  onAppConfigured = async ({ installationRequestId, config }) => {
    const { cma, evictWidget, appHookBus, app } = this.props;

    try {
      await installOrUpdate(cma, evictWidget, this.checkAppStatus, config);

      // Verify if installation was completed.
      const { appInstallation } = await this.checkAppStatus();
      if (!appInstallation) {
        // For whatever reason AppInstallation entity wasn't created.
        throw new Error('AppInstallation does not exist.');
      }

      if (this.state.busyWith === BUSY_STATE_UPDATE) {
        Notification.success('App configuration was updated successfully.');
        AppLifecycleTracking.configurationUpdated(app.id);
      } else {
        Notification.success('The app was installed successfully.');
        AppLifecycleTracking.installed(app.id);
      }

      this.setState({ isInstalled: true, busyWith: false });

      appHookBus.setInstallation(appInstallation);
      appHookBus.emit(APP_EVENTS_OUT.SUCCEEDED, { installationRequestId });
    } catch (err) {
      if (this.state.busyWith === BUSY_STATE_UPDATE) {
        Notification.error('Failed to update app configuration.');
        AppLifecycleTracking.configurationUpdateFailed(app.id);
      } else {
        Notification.error('Failed to install the app.');
        AppLifecycleTracking.installationFailed(app.id);
      }

      const { appInstallation } = await this.checkAppStatus();
      this.setState({ isInstalled: !!appInstallation, busyWith: false });

      appHookBus.setInstallation(appInstallation);
      appHookBus.emit(APP_EVENTS_OUT.FAILED, { installationRequestId });
    }
  };

  onAppMisconfigured = async () => {
    const { appInstallation } = await this.checkAppStatus();
    this.setState({ isInstalled: !!appInstallation, busyWith: false });
  };

  onAppMarkedAsReady = () => {
    const { loadingError } = this.state;
    if (!loadingError) {
      this.setState({ appLoaded: true });
    }
  };

  update = busyWith => {
    this.setState({ busyWith });
    this.props.appHookBus.emit(APP_EVENTS_OUT.STARTED);
  };

  uninstall = () => {
    const { app } = this.props;

    AppLifecycleTracking.uninstallationInitiated(app.id);

    return ModalLauncher.open(({ isShown, onClose }) => (
      <UninstallModal
        key={Date.now()}
        isShown={isShown}
        title={this.state.title}
        actionList={this.state.actionList}
        onConfirm={reasons => {
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

  uninstallApp = async reasons => {
    const { cma, evictWidget, app } = this.props;

    this.setState({ busyWith: BUSY_STATE_UNINSTALLATION });

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

  renderAccessDenied() {
    return (
      <Workbench>
        <Workbench.Header title={this.renderTitle()} onBack={this.props.goBackToList} />
        <Workbench.Content type="text">
          <EmptyStateContainer data-test-id="extensions.empty">
            <div className={defaultSVGStyle}>
              <EmptyStateIllustration />
            </div>
            <Heading>Not included in your pricing plan</Heading>
            <Paragraph>This app is available to customers on a committed, annual plan.</Paragraph>
            <Paragraph>
              If your interested in learning more about our expanded, enterprise-grade platform,
              contact your account manager.
            </Paragraph>

            <Button href={websiteUrl('/contact/sales/')}>Contact us</Button>
          </EmptyStateContainer>
        </Workbench.Content>
      </Workbench>
    );
  }

  renderBusyOverlay() {
    if (!this.state.busyWith) {
      return null;
    }

    return (
      <div className={styles.overlay}>
        <div className={styles.overlayPill}>
          <Paragraph className={styles.busyText}>
            <Spinner size="large" className={styles.spinner} />{' '}
            {BUSY_STATE_TO_TEXT[this.state.busyWith]}
          </Paragraph>
        </div>
      </div>
    );
  }

  renderTitle() {
    if (!this.state.appIcon) {
      return <Heading>{this.state.title}</Heading>;
    }

    return (
      <Heading>
        <img src={this.state.appIcon} className={styles.icon} />
        {this.state.title}
      </Heading>
    );
  }

  renderActions() {
    const { isInstalled, busyWith, appLoaded, loadingError } = this.state;
    return (
      <>
        {appLoaded && !isInstalled && (
          <Button
            buttonType="primary"
            onClick={() => this.update(BUSY_STATE_INSTALLATION)}
            loading={busyWith === BUSY_STATE_INSTALLATION}
            className={styles.actionButton}
            disabled={!!busyWith}>
            Install
          </Button>
        )}
        {(appLoaded || loadingError) && isInstalled && (
          <Button
            buttonType="muted"
            onClick={this.uninstall}
            loading={busyWith === BUSY_STATE_UNINSTALLATION}
            className={styles.actionButton}
            disabled={!!busyWith}>
            Uninstall
          </Button>
        )}
        {appLoaded && isInstalled && (
          <Button
            buttonType="primary"
            onClick={() => this.update(BUSY_STATE_UPDATE)}
            loading={busyWith === BUSY_STATE_UPDATE}
            className={styles.actionButton}
            disabled={!!busyWith}>
            Save
          </Button>
        )}
      </>
    );
  }

  renderContent() {
    const { appDefinition, appLoaded } = this.state;

    return (
      <Workbench.Content
        type="full"
        className={cx(styles.renderer, { [styles.hideRenderer]: !appLoaded })}>
        <ExtensionIFrameRenderer
          bridge={this.props.bridge}
          descriptor={buildAppDefinitionWidget(appDefinition)}
          parameters={this.parameters}
          isFullSize
        />
      </Workbench.Content>
    );
  }

  renderLoading(withoutWorkbench) {
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

  render() {
    if (!getSectionVisibility()['apps']) {
      return <StateRedirect to="spaces.detail.entries.list" />;
    }

    const { ready, appLoaded, loadingError, isInstalled, appEnabled } = this.state;

    if (!ready) {
      return this.renderLoading();
    }

    if (!appEnabled && !isInstalled) {
      return this.renderAccessDenied();
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
          {loadingError && this.renderLoadingError()}
          {!appLoaded && !loadingError && this.renderLoading(true)}
          {!loadingError && this.renderContent()}
        </Workbench>
      </>
    );
  }
}
