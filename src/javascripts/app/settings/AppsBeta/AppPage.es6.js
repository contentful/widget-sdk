import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { Button, Notification } from '@contentful/forma-36-react-components';
import { InstalledTag, NotInstalledTag } from './AppStateTags.es6';

import AdminOnly from 'app/common/AdminOnly.es6';
import Workbench from 'app/common/Workbench.es6';
import ExtensionIFrameRenderer from 'widgets/ExtensionIFrameRenderer.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import { FetcherLoading } from 'app/common/createFetcherComponent.es6';

import { installOrUpdate, uninstall } from './AppOperations.es6';
import { APP_EVENTS_IN, APP_EVENTS_OUT } from './AppHookBus.es6';

const BUSY_STATE_INSTALLATION = 'installation';
const BUSY_STATE_UPDATE = 'update';
const BUSY_STATE_UNINSTALLATION = 'uninstallation';

const BUSY_STATE_TO_TEXT = {
  [BUSY_STATE_INSTALLATION]: 'Installing the app',
  [BUSY_STATE_UPDATE]: 'Updating configuration',
  [BUSY_STATE_UNINSTALLATION]: 'Uninstalling the app'
};

const styles = {
  renderer: css({
    height: '100%',
    width: '100%'
  }),
  overlay: css({
    backgroundColor: 'rgba(0,0,0,.3)',
    position: 'fixed',
    zIndex: 9999,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: '200px',
    textAlign: 'center'
  }),
  busyText: css({
    display: 'inline-block',
    padding: '20px 30px',
    borderRadius: '25px',
    fontSize: '24px',
    backgroundColor: 'white'
  }),
  title: css({
    display: 'flex',
    alignItems: 'center'
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
      setParameters: PropTypes.func.isRequired,
      unsetParameters: PropTypes.func.isRequired
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
        extension: await repo.getExtensionForExtensionDefinition(extensionDefinition)
      };
    } catch (err) {
      // If there are 2 or more extensions for the same definition
      // we cannot reliably tell which one is managed by the App.
      // For the time being we just ask the customer to contact us.
      if (err.extensionCount > 1) {
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

    if (extension) {
      appHookBus.setParameters(extension.parameters);
    }

    appHookBus.on(APP_EVENTS_IN.CONFIGURED, this.onAppConfigured);
    appHookBus.on(APP_EVENTS_IN.MISCONFIGURED, this.onAppMisconfigured);

    this.setState({
      ready: true,
      isInstalled: !!extension,
      extensionDefinition
    });
  };

  onAppConfigured = async ({ installationRequestId, parameters }) => {
    const { cma, appHookBus } = this.props;

    try {
      await installOrUpdate(cma, this.checkAppStatus, { parameters });

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

      appHookBus.setParameters(extension.parameters);
      appHookBus.emit(APP_EVENTS_OUT.SUCCEEDED, { installationRequestId });
    } catch (err) {
      if (this.state.busyWith === BUSY_STATE_UPDATE) {
        Notification.error('Failed to update app configuration.');
      } else {
        Notification.error('Failed to install the app.');
      }

      const { extension } = await this.checkAppStatus();
      this.setState({ isInstalled: !!extension, busyWith: false });

      if (extension) {
        appHookBus.setParameters(extension.parameters);
      } else {
        appHookBus.unsetParameters();
      }

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

  uninstall = async () => {
    this.setState({ busyWith: BUSY_STATE_UNINSTALLATION });

    // Unset parameters immediately so they are not available
    // via the SDK method anymore.
    this.props.appHookBus.unsetParameters();

    try {
      await uninstall(this.props.cma, this.checkAppStatus);

      // Verify if uninstallation was completed.
      const { extension } = await this.checkAppStatus();
      if (extension) {
        Notification.error('Failed to fully uninstall the app.');
      } else {
        Notification.success('The app was uninstalled successfully.');
      }
    } catch (err) {
      Notification.error('Failed to fully uninstall the app.');
    }

    this.props.goBackToList();
  };

  render() {
    const { ready, extensionDefinition } = this.state;

    if (!ready) {
      return <FetcherLoading message="Loading app..." />;
    }

    return (
      <AdminOnly>
        <DocumentTitle title={extensionDefinition.name} />
        <Workbench>
          {this.renderHeader()}
          {this.renderContent()}
        </Workbench>
      </AdminOnly>
    );
  }

  renderHeader() {
    const { isInstalled, busyWith, extensionDefinition } = this.state;

    return (
      <Workbench.Header>
        <Workbench.Header.Back to="^.list" />
        <Workbench.Title>
          <div className={styles.title}>
            <span>{extensionDefinition.name}</span>
            {isInstalled ? <InstalledTag /> : <NotInstalledTag />}
          </div>
        </Workbench.Title>
        <Workbench.Header.Actions>
          {!isInstalled && (
            <Button
              buttonType="positive"
              onClick={() => this.update(BUSY_STATE_INSTALLATION)}
              loading={busyWith === BUSY_STATE_INSTALLATION}
              disabled={!!busyWith}>
              Install
            </Button>
          )}
          {isInstalled && (
            <Button
              buttonType="muted"
              onClick={() => this.update(BUSY_STATE_UPDATE)}
              loading={busyWith === BUSY_STATE_UPDATE}
              disabled={!!busyWith}>
              Save configuration
            </Button>
          )}
          {isInstalled && (
            <Button
              buttonType="negative"
              onClick={this.uninstall}
              loading={busyWith === BUSY_STATE_UNINSTALLATION}
              disabled={!!busyWith}>
              Uninstall
            </Button>
          )}
        </Workbench.Header.Actions>
      </Workbench.Header>
    );
  }

  renderContent() {
    return (
      <Workbench.Content>
        <div className={styles.renderer}>
          {this.state.busyWith && (
            <div className={styles.overlay}>
              <p className={styles.busyText}>{BUSY_STATE_TO_TEXT[this.state.busyWith]}</p>
            </div>
          )}
          <ExtensionIFrameRenderer
            bridge={this.props.bridge}
            descriptor={{ id: null, src: this.state.extensionDefinition.src }}
            parameters={this.parameters}
            isFullSize
          />
        </div>
      </Workbench.Content>
    );
  }
}
