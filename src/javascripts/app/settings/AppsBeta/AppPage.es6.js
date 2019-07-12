import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { get, pick } from 'lodash';

import { Button, Notification, Tag, Icon } from '@contentful/forma-36-react-components';

import AdminOnly from 'app/common/AdminOnly.es6';
import Workbench from 'app/common/Workbench.es6';
import ExtensionIFrameRenderer from 'widgets/ExtensionIFrameRenderer.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';

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

const styles = {
  renderer: css({
    position: 'relative',
    height: '100%',
    width: '100%'
  }),
  overlay: css({
    backgroundColor: 'rgba(255,255,255,.5)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    fontSize: '24px',
    textAlign: 'center',
    paddingTop: '100px'
  })
};

function hasParametersError(errors) {
  if (Array.isArray(errors)) {
    // Check if there's an error related to parameter validation.
    return !!errors.find(e => get(e, ['path', 0]) === 'parameters');
  } else {
    return false;
  }
}

const id = 'netlify-build-and-preview';

function fetchExtensionDefinition() {
  return Promise.resolve({
    sys: {
      id: 'some-uuid',
      type: 'ExtensionDefinition'
    },
    name: 'Netlify build and preview',
    description: 'Lorem ipsum dolor sit amet',
    src: 'http://localhost:1234',
    locations: ['app'],
    parameters: {
      installation: [
        { id: 'buildHookIds', name: 'Netlify build hook IDs', required: true, type: 'Symbol' },
        {
          id: 'notificationHookIds',
          name: 'Netlify notification hook IDs',
          required: true,
          type: 'Symbol'
        },
        { id: 'names', name: 'Human-readable site names', required: true, type: 'Symbol' },
        { id: 'siteNames', name: 'Netlify site names', required: true, type: 'Symbol' },
        { id: 'siteIds', name: 'Netlify site IDs', required: true, type: 'Symbol' },
        { id: 'siteUrls', name: 'Netlify site URLs', required: true, type: 'Symbol' }
      ]
    }
  });
}

export default class AppRoute extends Component {
  static propTypes = {
    goBackToList: PropTypes.func.isRequired,
    spaceId: PropTypes.string.isRequired,
    environmentId: PropTypes.string.isRequired,
    appId: PropTypes.string.isRequired,
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
    const { appHookBus, cma } = this.props;

    const extensionDefinition = await fetchExtensionDefinition();
    const isInstalled = await this.isInstalled();

    try {
      const extension = await cma.getExtension(id);
      appHookBus.setParameters(extension.parameters);
    } catch (err) {
      // ignore...
    }

    this.setState({ ready: true, extensionDefinition, isInstalled });

    appHookBus.on(APP_CONFIGURED, async ({ installationRequestId, parameters }) => {
      let current;
      try {
        current = await cma.getExtension(id);
      } catch (err) {
        // ignore...
      }

      try {
        if (current) {
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
        const isValidationError = get(err, ['data', 'sys', 'id']) === 'ValidationFailed';
        const errors = get(err, ['data', 'details', 'errors'], []);

        if (isValidationError && hasParametersError(errors)) {
          Notification.error('Configuration provided is invalid.');
        } else {
          Notification.error('Failed to install the app.');
        }

        const isInstalled = await this.isInstalled();
        this.setState({ isInstalled, busyWith: false });
        appHookBus.emit(APP_EXTENSION_UPDATE_FAILED, { installationRequestId });
      }
    });

    appHookBus.on(APP_MISCONFIGURED, async () => {
      const isInstalled = await this.isInstalled();
      this.setState({ isInstalled, busyWith: false });
    });

    appHookBus.on(APP_UPDATE_FINALIZED, async () => {
      if (this.state.busyWith === BUSY_STATE_UPDATE) {
        Notification.success('The app configuration was updated successfully.');
      } else {
        Notification.success('The app was installed successfully.');
      }

      const isInstalled = await this.isInstalled();
      this.setState({ isInstalled, busyWith: false });
    });

    appHookBus.on(APP_UPDATE_FAILED, async () => {
      try {
        await this.props.cma.deleteExtension(id);
      } catch (err) {
        // ignore
      }

      Notification.error('Failed to install the app.');
      this.setState({ isInstalled: false, busyWith: false });
    });
  }

  isInstalled = async () => {
    try {
      await this.props.cma.getExtension(id);
      return true;
    } catch (err) {
      // ignore
    }

    return false;
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
      const isInstalled = await this.isInstalled();

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
      return <div>Loading...</div>;
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
            <div className={styles.overlay}>I am busy with {this.state.busyWith}</div>
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
