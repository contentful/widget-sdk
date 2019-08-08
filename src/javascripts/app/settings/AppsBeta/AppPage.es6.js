import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
import { InstalledTag, NotInstalledTag } from './AppStateTags.es6';

import AdminOnly from 'app/common/AdminOnly.es6';
import ExtensionIFrameRenderer from 'widgets/ExtensionIFrameRenderer.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import * as Telemetry from 'i13n/Telemetry.es6';

import { installOrUpdate, uninstall } from './AppOperations.es6';
import { APP_EVENTS_IN, APP_EVENTS_OUT } from './AppHookBus.es6';
import UninstallModal from './UninstallModal.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import AppIcon from '../apps/_common/AppIcon.es6';

const BUSY_STATE_INSTALLATION = 'installation';
const BUSY_STATE_UPDATE = 'update';
const BUSY_STATE_UNINSTALLATION = 'uninstallation';

const BUSY_STATE_TO_TEXT = {
  [BUSY_STATE_INSTALLATION]: 'Installing the app...',
  [BUSY_STATE_UPDATE]: 'Updating configuration...',
  [BUSY_STATE_UNINSTALLATION]: 'Uninstalling the app...'
};

// eslint-disable-next-line no-restricted-syntax
const fadeIn = keyframes`
  from {
    transform: translateY(50px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }`;

const styles = {
  renderer: css({
    padding: 0,
    animation: `${fadeIn} 0.8s ease`,
    '> div': {
      height: '100%',
      width: '100%'
    }
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
  })
};

export default class AppRoute extends Component {
  static propTypes = {
    goBackToList: PropTypes.func.isRequired,
    appId: PropTypes.string.isRequired,
    repo: PropTypes.shape({
      getExtensionDefinitionForApp: PropTypes.func.isRequired,
      getExtensionForExtensionDefinition: PropTypes.func.isRequired
    }).isRequired,
    bridge: PropTypes.object.isRequired,
    appHookBus: PropTypes.shape({
      on: PropTypes.func.isRequired,
      emit: PropTypes.func.isRequired,
      setExtension: PropTypes.func.isRequired
    }).isRequired,
    cma: PropTypes.shape({
      getExtension: PropTypes.func.isRequired,
      createExtension: PropTypes.func.isRequired,
      updateExtension: PropTypes.func.isRequired,
      deleteExtension: PropTypes.func.isRequired
    }).isRequired
  };

  state = { ready: false };

  // There are no parameters in the app location
  parameters = {
    installation: {},
    instance: {}
  };

  async componentDidMount() {
    try {
      await this.initialize();
    } catch (err) {
      Telemetry.count('apps.app-loading-failed');
      Notification.error('Failed to load the app.');
      this.props.goBackToList();
    }
  }

  checkAppStatus = async extensionDefinition => {
    extensionDefinition = extensionDefinition || this.state.extensionDefinition;

    const { repo, appId } = this.props;
    const result = { appId, extensionDefinition };

    try {
      return {
        ...result,
        extension: await repo.getExtensionForExtensionDefinition(extensionDefinition.sys.id)
      };
    } catch (err) {
      // If there are 2 or more extensions for the same definition
      // we cannot reliably tell which one is managed by the App.
      // For the time being we just ask the customer to contact us.
      // I think this is very unlikely to ever happen (requires manual
      // API entity modification).
      if (err.extensionCount > 1) {
        Telemetry.count('apps.non-unique-app-extension');
        Notification.error('The app has crashed. Please contact support.');
        this.props.goBackToList();
      }

      return result;
    }
  };

  initialize = async () => {
    const { appHookBus, appId, repo } = this.props;

    const extensionDefinition = await repo.getExtensionDefinitionForApp(appId);
    const { extension } = await this.checkAppStatus(extensionDefinition);

    appHookBus.setExtension(extension);
    appHookBus.on(APP_EVENTS_IN.CONFIGURED, this.onAppConfigured);
    appHookBus.on(APP_EVENTS_IN.MISCONFIGURED, this.onAppMisconfigured);

    this.setState({
      ready: true,
      isInstalled: !!extension,
      extensionDefinition
    });
  };

  onAppConfigured = async ({ installationRequestId, config }) => {
    const { cma, appHookBus } = this.props;

    try {
      await installOrUpdate(cma, this.checkAppStatus, config);

      // Verify if installation was completed.
      const { extension } = await this.checkAppStatus();
      if (!extension) {
        // For whatever reason Extension entity wasn't created.
        throw new Error('Extension does not exist.');
      }

      if (this.state.busyWith === BUSY_STATE_UPDATE) {
        Notification.success('App configuration was updated successfully.');
      } else {
        Notification.success('The app was installed successfully.');
      }

      this.setState({ isInstalled: true, busyWith: false });

      appHookBus.setExtension(extension);
      appHookBus.emit(APP_EVENTS_OUT.SUCCEEDED, { installationRequestId });
    } catch (err) {
      if (this.state.busyWith === BUSY_STATE_UPDATE) {
        Notification.error('Failed to update app configuration.');
      } else {
        Notification.error('Failed to install the app.');
      }

      const { extension } = await this.checkAppStatus();
      this.setState({ isInstalled: !!extension, busyWith: false });

      appHookBus.setExtension(extension);
      appHookBus.emit(APP_EVENTS_OUT.FAILED, { installationRequestId });
    }
  };

  onAppMisconfigured = async () => {
    const { extension } = await this.checkAppStatus();
    this.setState({ isInstalled: !!extension, busyWith: false });
  };

  update = busyWith => {
    this.setState({ busyWith });
    this.props.appHookBus.emit(APP_EVENTS_OUT.STARTED);
  };

  uninstall = () => {
    return ModalLauncher.open(({ isShown, onClose }) => (
      <UninstallModal
        key={Date.now()}
        isShown={isShown}
        appName={this.state.extensionDefinition.name}
        actionList={[]} // todo: EXT-933 add the action list from the app's JSON config
        onConfirm={
          async (/* reasons */) => {
            // todo: EXT-933 This function is passed a `reasons` array argument which we can use
            // to track reasons for uninstalling apps
            onClose(true);
            await this.uninstallApp();
          }
        }
        onClose={() => {
          onClose(true);
        }}
      />
    ));
  };

  uninstallApp = async () => {
    this.setState({ busyWith: BUSY_STATE_UNINSTALLATION });

    // Unset extension immediately so its parameters are not exposed
    // via the SDK as soon as the proces was initiated.
    this.props.appHookBus.setExtension(null);

    try {
      await uninstall(this.props.cma, this.checkAppStatus);

      // Verify if uninstallation was completed.
      const { extension } = await this.checkAppStatus();
      if (extension) {
        throw new Error('Extension still exists.');
      }

      Notification.success('The app was uninstalled successfully.');
    } catch (err) {
      Notification.error('Failed to fully uninstall the app.');
    }

    this.props.goBackToList();
  };

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
    const { isInstalled, extensionDefinition } = this.state;
    return (
      <>
        <Heading>
          <AppIcon appId={this.props.appId} className={styles.appIcon} /> {extensionDefinition.name}
        </Heading>
        {isInstalled ? <InstalledTag /> : <NotInstalledTag />}
      </>
    );
  }

  renderActions() {
    const { isInstalled, busyWith } = this.state;
    return (
      <>
        {!isInstalled && (
          <Button
            buttonType="primary"
            onClick={() => this.update(BUSY_STATE_INSTALLATION)}
            loading={busyWith === BUSY_STATE_INSTALLATION}
            className={styles.actionButton}
            disabled={!!busyWith}>
            Install
          </Button>
        )}
        {isInstalled && (
          <Button
            buttonType="muted"
            onClick={this.uninstall}
            loading={busyWith === BUSY_STATE_UNINSTALLATION}
            className={styles.actionButton}
            disabled={!!busyWith}>
            Uninstall
          </Button>
        )}
        {isInstalled && (
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
    return (
      <Workbench.Content type="full" className={styles.renderer}>
        <ExtensionIFrameRenderer
          bridge={this.props.bridge}
          descriptor={{ id: null, src: this.state.extensionDefinition.src }}
          parameters={this.parameters}
          isFullSize
        />
      </Workbench.Content>
    );
  }

  renderLoading() {
    return (
      <Workbench>
        <Workbench.Header title="" onBack={this.props.goBackToList} />
        <Workbench.Content type="text">
          <SkeletonContainer ariaLabel="Loading app..." svgWidth="100%" svgHeight="300px">
            <SkeletonBodyText numberOfLines={5} marginBottom={15} offsetTop={60} />
          </SkeletonContainer>
        </Workbench.Content>
      </Workbench>
    );
  }

  render() {
    const { ready, extensionDefinition } = this.state;

    if (!ready) {
      return this.renderLoading();
    }

    return (
      <AdminOnly>
        <DocumentTitle title={extensionDefinition.name} />
        {this.renderBusyOverlay()}
        <Workbench>
          <Workbench.Header
            onBack={() => {
              this.props.goBackToList();
            }}
            title={this.renderTitle()}
            actions={this.renderActions()}
          />
          {this.renderContent()}
        </Workbench>
      </AdminOnly>
    );
  }
}
