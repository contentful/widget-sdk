import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { pick } from 'lodash';

import { Button, Notification, Tag, Icon } from '@contentful/forma-36-react-components';

import AdminOnly from 'app/common/AdminOnly.es6';
import Workbench from 'app/common/Workbench.es6';
import ExtensionIFrameRenderer from 'widgets/ExtensionIFrameRenderer.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import { FetcherLoading } from 'app/common/createFetcherComponent.es6';

import {
  APP_UPDATE_STARTED,
  APP_EXTENSION_UPDATED,
  APP_EXTENSION_UPDATE_FAILED,
  APP_MISCONFIGURED,
  APP_CONFIGURED,
  APP_UPDATE_FAILED,
  APP_UPDATE_FINALIZED
} from './AppHookBus.es6';

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
  })
};

const id = 'netlify-build-and-preview';

export default class AppRoute extends Component {
  static propTypes = {
    goBackToList: PropTypes.func.isRequired,
    appId: PropTypes.string.isRequired,
    repo: PropTypes.shape({
      getExtensionDefinitionForApp: PropTypes.func.isRequired,
      getExtensionForExtensionDefinition: PropTypes.func.isRequired
    }).isRequired,
    bridge: PropTypes.shape({
      getData: PropTypes.func.isRequired,
      install: PropTypes.func.isRequired,
      apply: PropTypes.func.isRequired
    }).isRequired,
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

  constructor(props) {
    super(props);
    this.state = { ready: false };

    // There are no parameters in the app location
    this.parameters = {
      installation: {},
      instance: {}
    };
  }

  async componentDidMount() {
    try {
      await this.initialize();
    } catch (err) {
      Notification.error('Failed to load the app.');
      this.props.goBackToList();
    }
  }

  initialize = async () => {
    const { appHookBus, appId, repo } = this.props;

    const extensionDefinition = await repo.getExtensionDefinitionForApp(appId);
    const [isInstalled, extension] = await this.isInstalled(extensionDefinition);

    if (isInstalled && extension) {
      appHookBus.setParameters(extension.parameters);
    }

    this.setupListeners();

    this.setState({ ready: true, extensionDefinition, isInstalled });
  };

  setupListeners = () => {
    const { appHookBus, cma } = this.props;

    appHookBus.on(APP_CONFIGURED, async ({ installationRequestId, parameters }) => {
      try {
        const [isInstalled, current] = await this.isInstalled();

        if (isInstalled && current) {
          await cma.updateExtension({ ...current, parameters });
        } else {
          await cma.createExtension({
            sys: { id },
            extension: pick(this.state.extensionDefinition, ['name', 'src', 'parameters']),
            parameters
          });
        }

        appHookBus.setParameters(parameters);
        appHookBus.emit(APP_EXTENSION_UPDATED, { installationRequestId, extensionId: id });
      } catch (err) {
        Notification.error('Failed to install the app.');
        const [isInstalled] = await this.isInstalled();
        this.setState({ isInstalled, busyWith: false });
        appHookBus.emit(APP_EXTENSION_UPDATE_FAILED, { installationRequestId });
      }
    });

    appHookBus.on(APP_MISCONFIGURED, async () => {
      const [isInstalled] = await this.isInstalled();
      this.setState({ isInstalled, busyWith: false });
    });

    appHookBus.on(APP_UPDATE_FINALIZED, async () => {
      if (this.state.busyWith === BUSY_STATE_UPDATE) {
        Notification.success('The app configuration was updated successfully.');
      } else {
        Notification.success('The app was installed successfully.');
      }

      const [isInstalled] = await this.isInstalled();
      this.setState({ isInstalled, busyWith: false });
    });

    appHookBus.on(APP_UPDATE_FAILED, async () => {
      Notification.error('Failed to install the app.');
      const [isInstalled] = await this.isInstalled();
      this.setState({ isInstalled, busyWith: false });
    });
  };

  isInstalled = async definition => {
    definition = definition || this.state.extensionDefinition;

    try {
      const extension = await this.props.repo.getExtensionForExtensionDefinition(definition);
      return [true, extension];
    } catch (err) {
      return [false];
    }
  };

  update = busyWith => {
    this.setState({ busyWith });
    this.props.appHookBus.emit(APP_UPDATE_STARTED);
  };

  uninstall = async () => {
    this.setState({ busyWith: BUSY_STATE_UNINSTALLATION });
    this.props.appHookBus.unsetParameters();

    try {
      await this.props.cma.deleteExtension(id);
      const [isInstalled] = await this.isInstalled();

      if (isInstalled) {
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
          {`App: ${extensionDefinition.name} `}
          {!isInstalled && (
            <Tag tagType="negative">
              <Icon icon="ErrorCircle" /> Not installed yet
            </Tag>
          )}
          {isInstalled && (
            <Tag tagType="positive">
              <Icon icon="CheckCircle" /> Installed
            </Tag>
          )}
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
