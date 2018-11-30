import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Notification } from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';

import $state from '$state';

import { cloneDeep, uniqBy } from 'lodash';
import * as Random from 'utils/Random.es6';

import * as NetlifyClient from './NetlifyClient.es6';
import * as NetlifyIntegration from './NetlifyIntegration.es6';
import NetlifyConfigEditor from './NetlifyConfigEditor.es6';
import NetlifyConnection from './NetlifyConnection.es6';
import AppUninstallDialog from '../dialogs/AppUninstallDialog.es6';

export default class NetlifyAppPage extends Component {
  static propTypes = {
    app: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      installed: PropTypes.bool.isRequired,
      config: PropTypes.object.isRequired
    }).isRequired,
    ticketId: PropTypes.string.isRequired,
    client: PropTypes.shape({
      save: PropTypes.func.isRequired,
      remove: PropTypes.func.isRequired
    }).isRequired
  };

  constructor(props) {
    super(props);

    const config = cloneDeep(props.app.config);
    config.installationId = config.installationId || Random.id();
    config.sites = config.sites || [{}];

    const netlifySites = config.sites
      .filter(s => s.netlifySiteName)
      .map(s => ({ id: s.netlifySiteId, name: s.netlifySiteName }));

    this.state = {
      installed: props.app.installed,
      config,
      netlifySites: uniqBy(netlifySites, s => s.id)
    };
  }

  componentWillUnmount() {
    if (this.cancelTicketPolling) {
      this.cancelTicketPolling();
    }
  }

  onConnectClick = () => {
    this.cancelTicketPolling = NetlifyClient.getAccessTokenWithTicket(
      this.props.ticketId,
      (err, token) => {
        if (err) {
          this.setState({ err });
        } else if (token) {
          this.initNetlifyConnection(token);
        }
      }
    );
  };

  initNetlifyConnection = async ({ token, email }) => {
    try {
      const { sites, counts } = await NetlifyClient.listSites(token);
      Notification.success('Netlify account connected successfully.');
      this.setState({ token, email, netlifySites: sites, netlifyCounts: counts });
    } catch (err) {
      this.setState({ err });
    }
  };

  onInstallClick = async () => {
    this.setState({ busyWith: 'install' });
    const { config, token } = this.state;

    try {
      const updatedConfig = await NetlifyIntegration.install(config, this.props.client, token);
      Notification.success('Netlify app installed successfully.');
      this.setState({ busyWith: false, installed: true, config: updatedConfig });
    } catch (err) {
      Notification.error(err.useMessage ? err.message : 'Failed to install Netlify app.');
      this.setState({ busyWith: false });
    }
  };

  onUpdateClick = async () => {
    this.setState({ busyWith: 'update' });
    const { config, token } = this.state;

    try {
      const updatedConfig = await NetlifyIntegration.update(config, this.props.client, token);
      Notification.success('Netlify app configuration updated successfully.');
      this.setState({ busyWith: false, config: updatedConfig });
    } catch (err) {
      Notification.error(
        err.useMessage ? err.message : 'Failed to update Netlify app configuration.'
      );
      this.setState({ busyWith: false });
    }
  };

  onUninstallClick = async () => {
    const confirmed = await ModalLauncher.open(({ isShown, onClose }) => (
      <AppUninstallDialog
        app={this.props.app}
        isShown={isShown}
        onCancel={() => onClose(false)}
        onConfirm={() => onClose(true)}
      />
    ));

    if (!confirmed) {
      return;
    }

    this.setState({ busyWith: 'uninstall' });

    try {
      await NetlifyIntegration.uninstall(this.props.client, this.state.token);
      Notification.success('Netlify app uninstalled successfully.');
      $state.go('^.list');
    } catch (err) {
      Notification.error(err.useMessage ? err.message : 'Failed to uninstall Netlify app.');
    }
  };

  render() {
    const { installed, busyWith, token } = this.state;

    return (
      <Workbench>
        <Workbench.Header>
          <Workbench.Header.Back to="^.list" />
          <Workbench.Icon icon="page-settings" />
          <Workbench.Title>App: {this.props.app.title}</Workbench.Title>
          <Workbench.Header.Actions>
            {installed && (
              <Button
                buttonType="muted"
                disabled={!!busyWith}
                loading={busyWith === 'uninstall'}
                onClick={this.onUninstallClick}>
                Uninstall
              </Button>
            )}
            {installed && (
              <Button
                buttonType="positive"
                disabled={!token || !!busyWith}
                loading={busyWith === 'update'}
                onClick={this.onUpdateClick}>
                Update
              </Button>
            )}
            {!installed && (
              <Button
                buttonType="positive"
                disabled={!token || !!busyWith}
                loading={busyWith === 'install'}
                onClick={this.onInstallClick}>
                Install
              </Button>
            )}
          </Workbench.Header.Actions>
        </Workbench.Header>
        <Workbench.Content centered>
          <div className="netlify-app__section">
            <h3>About</h3>
            <p>
              With this app developers will enjoy a very quick set up. Authors will control when
              pages are created and see the current status of the build process.
            </p>
          </div>

          <NetlifyConnection
            connected={!!token}
            installed={installed}
            email={this.state.email}
            netlifyCounts={this.state.netlifyCounts}
            onConnectClick={this.onConnectClick}
          />

          <div className="netlify-app__section">
            <h3>Build Netlify sites</h3>
            <p>
              Pick Netlify sites you want to enable build for.
              {!token && ' Requires Netlify connection.'}
            </p>
            <NetlifyConfigEditor
              disabled={!token}
              siteConfigs={this.state.config.sites}
              netlifySites={this.state.netlifySites}
              onSiteConfigsChange={siteConfigs => {
                this.setState(state => ({
                  ...state,
                  config: { ...state.config, sites: siteConfigs }
                }));
              }}
            />
          </div>
        </Workbench.Content>
      </Workbench>
    );
  }
}
