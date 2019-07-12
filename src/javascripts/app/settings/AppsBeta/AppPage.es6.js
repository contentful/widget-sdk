import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { get, pick } from 'lodash';

import { Button, Notification } from '@contentful/forma-36-react-components';

import AdminOnly from 'app/common/AdminOnly.es6';
import Workbench from 'app/common/Workbench.es6';
import ExtensionIFrameRenderer from 'widgets/ExtensionIFrameRenderer.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';

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
    spaceId: PropTypes.string.isRequired,
    environmentId: PropTypes.string.isRequired,
    appId: PropTypes.string.isRequired,
    bridge: PropTypes.object.isRequired,
    appBus: PropTypes.object.isRequired,
    cma: PropTypes.object.isRequired
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
    const { appBus } = this.props;

    const extensionDefinition = await fetchExtensionDefinition();
    const isInstalled = await this.isInstalled();

    try {
      const extension = await this.props.cma.getExtension(id);
      appBus.parameters = extension.parameters || null;
    } catch (err) {
      // ignore...
    }

    this.setState({ ready: true, extensionDefinition, isInstalled });

    appBus.on(appBus.EVENTS.APP_CONFIGURED, async ({ installationRequestId, parameters }) => {
      let current;
      try {
        current = await this.props.cma.getExtension(id);
      } catch (err) {
        // ignore...
      }

      try {
        if (current) {
          await this.props.cma.updateExtension({ ...current, parameters });
        } else {
          await this.props.cma.createExtension({
            sys: { id },
            extension: pick(this.state.extensionDefinition, ['name', 'src', 'parameters']),
            parameters
          });
        }

        appBus.parameters = parameters;

        appBus.emit(appBus.EVENTS.APP_EXTENSION_UPDATED, {
          installationRequestId,
          extensionId: id
        });
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
        appBus.emit(appBus.EVENTS.APP_EXTENSION_UPDATE_FAILED, { installationRequestId });
      }
    });

    appBus.on(appBus.EVENTS.APP_MISCONFIGURED, async () => {
      const isInstalled = await this.isInstalled();
      this.setState({ isInstalled, busyWith: false });
    });

    appBus.on(appBus.EVENTS.APP_UPDATE_FINALIZED, async () => {
      if (this.state.busyWith === BUSY_STATE_UPDATE) {
        Notification.success('The app configuration was updated successfully.');
      } else {
        Notification.success('The app was installed successfully.');
      }

      const isInstalled = await this.isInstalled();
      this.setState({ isInstalled, busyWith: false });
    });

    appBus.on(appBus.EVENTS.APP_UPDATE_FAILED, async () => {
      try {
        await this.props.cma.deleteExtension(id);
      } catch (err) {
        // ignore
      }

      appBus.parameters = null;
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
    const { appBus } = this.props;
    this.setState({ busyWith });
    appBus.emit(appBus.EVENTS.APP_UPDATE_STARTED);
  };

  uninstall = async () => {
    this.setState({ busyWith: BUSY_STATE_UNINSTALLATION });

    try {
      await this.props.cma.deleteExtension(id);
      const isInstalled = await this.isInstalled();
      this.setState({ isInstalled, busyWith: false });

      if (isInstalled) {
        Notification.error('Failed to uninstall the app.');
      } else {
        Notification.success('The app was uninstalled successfully.');
      }
    } catch (err) {
      Notification.error('Failed to uninstall the app.');
    }
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
          {this.renderHeader(extensionDefinition)}
          {this.renderContent(extensionDefinition)}
        </Workbench>
      </AdminOnly>
    );
  }

  renderHeader({ name }) {
    const { isInstalled, busyWith } = this.state;

    return (
      <Workbench.Header>
        <Workbench.Header.Back to="^.list" />
        <Workbench.Title>
          App: {name} ({isInstalled ? '' : 'not '}installed)
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

  renderContent({ src }) {
    return (
      <Workbench.Content>
        <div className={styles.renderer}>
          {this.state.busyWith && (
            <div className={styles.overlay}>I am busy with {this.state.busyWith}</div>
          )}
          <ExtensionIFrameRenderer
            bridge={this.props.bridge}
            descriptor={{ id: null, src }}
            parameters={this.parameters}
            isFullSize
          />
        </div>
      </Workbench.Content>
    );
  }
}
