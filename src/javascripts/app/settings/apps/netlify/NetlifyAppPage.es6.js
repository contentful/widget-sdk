import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Notification, Note } from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';

import $state from '$state';
import * as Analytics from 'analytics/Analytics.es6';
import intercom from 'intercom';

import { cloneDeep, uniqBy } from 'lodash';
import * as Random from 'utils/Random.es6';

import AppIcon from '../_common/AppIcon.es6';
import * as NetlifyClient from './NetlifyClient.es6';
import * as NetlifyIntegration from './NetlifyIntegration.es6';
import NetlifyConfigEditor from './NetlifyConfigEditor.es6';
import NetlifyConnection from './NetlifyConnection.es6';
import AppUninstallDialog from '../dialogs/AppUninstallDialog.es6';
import NoConnectionUninstallDialog from './NoConnectionUninstallDialog.es6';
import AppsFeedback from '../AppsFeedback.es6';

const notifyError = (err, fallbackMessage) => {
  Notification.error(err.useMessage ? err.message || fallbackMessage : fallbackMessage);
};

export default class NetlifyAppPage extends Component {
  static propTypes = {
    app: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      installed: PropTypes.bool.isRequired,
      config: PropTypes.object.isRequired
    }).isRequired,
    ticketId: PropTypes.string.isRequired,
    contentTypeIds: PropTypes.arrayOf(PropTypes.string).isRequired,
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

    // Initially we are not connected to Netlify and we don't have
    // a full list of Netlify sites.
    // Here we are computing a list consisting of sites we know
    // of so we can offer Netlify site labels even before connecting.
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
    this.stopPolling();
  }

  stopPolling = () => {
    // Once authentication process is started, we poll for results.
    // When we leave this page or start a new OAuth flow authentication
    // process is aborted and the polling needs to be cancelled.
    if (this.cancelTicketPolling) {
      this.cancelTicketPolling();
    }
  };

  onConnectClick = () => {
    this.stopPolling();

    this.cancelTicketPolling = NetlifyClient.getAccessTokenWithTicket(
      this.props.ticketId,
      (err, token) => {
        if (err) {
          notifyError(err, 'Failed to connect with Netlify. Try again!');
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
      Analytics.track('netlify:connected');
    } catch (err) {
      notifyError(err, 'Failed to connect with Netlify. Try again!');
    }
  };

  getIntegrationContext = () => {
    return {
      config: this.state.config,
      contentTypeIds: this.props.contentTypeIds,
      appsClient: this.props.client,
      accessToken: this.state.token
    };
  };

  onInstallClick = async () => {
    try {
      this.setState({ busyWith: 'install' });
      const updatedConfig = await NetlifyIntegration.install(this.getIntegrationContext());
      Notification.success('Netlify app installed successfully.');
      this.setState({ busyWith: false, installed: true, config: updatedConfig });
      Analytics.track('netlify:installed');
      intercom.trackEvent('apps-alpha-netlify-installed');
    } catch (err) {
      notifyError(err, 'Failed to install Netlify app.');
      this.setState({ busyWith: false });
    }
  };

  onUpdateClick = async () => {
    try {
      this.setState({ busyWith: 'update' });
      const updatedConfig = await NetlifyIntegration.update(this.getIntegrationContext());
      Notification.success('Netlify app configuration updated successfully.');
      this.setState({ busyWith: false, config: updatedConfig });
      Analytics.track('netlify:updated');
    } catch (err) {
      notifyError(err, 'Failed to update Netlify app configuration.');
      this.setState({ busyWith: false });
    }
  };

  uninstall = async () => {
    try {
      this.setState({ busyWith: 'uninstall' });
      await NetlifyIntegration.uninstall(this.getIntegrationContext());
      Notification.success('Netlify app uninstalled successfully.');
      Analytics.track('netlify:uninstalled');
      $state.go('^.list');
    } catch (err) {
      notifyError(err, 'Failed to uninstall Netlify app.');
      this.setState({ busyWith: false });
    }
  };

  confirmUninstall = () => {
    if (this.state.token) {
      return ModalLauncher.open(({ isShown, onClose }) => (
        <AppUninstallDialog
          app={this.props.app}
          isShown={isShown}
          onCancel={() => onClose(false)}
          onConfirm={() => onClose(true)}
        />
      ));
    }

    return ModalLauncher.open(({ isShown, onClose }) => (
      <NoConnectionUninstallDialog
        isShown={isShown}
        onCancel={() => onClose(false)}
        onConfirm={() => onClose(true)}
      />
    ));
  };

  onUninstallClick = async () => {
    const confirmed = await this.confirmUninstall();
    if (confirmed) {
      this.uninstall();
    }
  };

  isDisabled = () => !this.state.token || !!this.state.busyWith;

  onSiteConfigsChange = siteConfigs => {
    this.setState(state => ({
      ...state,
      config: { ...state.config, sites: siteConfigs }
    }));
  };

  render() {
    return (
      <Workbench>
        {this.renderHeader()}
        {this.renderContent()}
      </Workbench>
    );
  }

  renderHeader() {
    const { installed, busyWith } = this.state;

    return (
      <Workbench.Header>
        <Workbench.Header.Back to="^.list" />
        <Workbench.Icon>
          <AppIcon appId="netlify" />
        </Workbench.Icon>
        <Workbench.Title>App: {this.props.app.title}</Workbench.Title>
        <Workbench.Header.Actions>
          {installed && (
            <Button
              buttonType="muted"
              disabled={!!busyWith} // One can uninstall without a token.
              loading={busyWith === 'uninstall'}
              onClick={this.onUninstallClick}>
              Uninstall
            </Button>
          )}
          {installed && (
            <Button
              buttonType="positive"
              disabled={this.isDisabled()}
              loading={busyWith === 'update'}
              onClick={this.onUpdateClick}>
              Save
            </Button>
          )}
          {!installed && (
            <Button
              buttonType="positive"
              disabled={this.isDisabled()}
              loading={busyWith === 'install'}
              onClick={this.onInstallClick}>
              Save
            </Button>
          )}
        </Workbench.Header.Actions>
      </Workbench.Header>
    );
  }

  renderContent() {
    return (
      <Workbench.Content centered>
        <Note>
          Let us know how we can improve the Netlify app. <AppsFeedback about="Netlify app" />
        </Note>

        <div className="netlify-app__section">
          <h3>About</h3>
          <p>
            With this app developers can do a very quick set up, authors can control when the static
            pages are created and see the current status of the build process.{' '}
            <a
              href="https://www.contentful.com/developers/docs/extensibility/apps/netlify/"
              target="_blank"
              rel="noopener noreferrer">
              Read the docs
            </a>
            .
          </p>
        </div>

        <NetlifyConnection
          connected={!!this.state.token}
          email={this.state.email}
          netlifyCounts={this.state.netlifyCounts}
          onConnectClick={this.onConnectClick}
        />

        <div className="netlify-app__section">
          <h3>Build Netlify sites</h3>
          <p>
            Pick the Netlify sites you want to enable build for.
            {!this.state.token && ' Requires Netlify account.'}
          </p>
          <NetlifyConfigEditor
            disabled={this.isDisabled()}
            siteConfigs={this.state.config.sites}
            netlifySites={this.state.netlifySites}
            onSiteConfigsChange={this.onSiteConfigsChange}
          />
        </div>
      </Workbench.Content>
    );
  }
}
