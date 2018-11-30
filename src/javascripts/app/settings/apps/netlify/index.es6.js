import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import AppIcon from '../_common/AppIcon.es6';
import AppUninstallDialog from '../dialogs/AppUninstallDialog.es6';
import * as NetlifyClient from './NetlifyClient.es6';
import { cloneDeep, uniqBy } from 'lodash';
import * as Random from 'utils/Random.es6';
import NetlifyConfigEditor from './NetlifyConfigEditor.es6';

export default class NetlifyPage extends Component {
  static propTypes = {
    app: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      installed: PropTypes.bool.isRequired,
      config: PropTypes.object.isRequired
    }).isRequired,
    onInstall: PropTypes.func.isRequired,
    onUninstall: PropTypes.func.isRequired
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
      config,
      netlifySites: uniqBy(netlifySites, s => s.id)
    };
  }

  async componentDidMount() {
    const ticketId = await NetlifyClient.createTicket();
    this.setState({ ticketId });
  }

  componentWillUnmount() {
    if (this.cancel) {
      this.cancel();
    }
  }

  onInstallClick = async () => {
    this.setState({ isBusy: true });

    // DO SOME APP-SPECIFIC SETUP
    // for example create Netlify webhooks

    await this.props.onInstall(this.props.app.id, this.state.config);
  };

  onUpdateClick = async () => {
    this.setState({ isBusy: true });

    // DO SOME APP-SPECIFIC SETUP
    // for example update Netlify webhooks

    await this.props.onInstall(this.props.app.id, this.state.config);
  };

  onUninstallClick = async () => {
    const app = this.props.app;
    const confirmed = await ModalLauncher.open(({ isShown, onClose }) => (
      <AppUninstallDialog
        app={app}
        isShown={isShown}
        onCancel={() => {
          onClose(false);
        }}
        onConfirm={() => {
          onClose(true);
        }}
      />
    ));
    if (confirmed) {
      this.props.onUninstall(app.id);
    }
  };

  auth = () => {
    this.cancel = NetlifyClient.getAccessTokenWithTicket(this.state.ticketId, (err, token) => {
      if (err) {
        this.setState({ err });
      } else if (token) {
        NetlifyClient.listSites(token).then(
          sites => this.setState(state => ({ ...state, token, netlify: { sites } })),
          err => this.setState({ err })
        );
      }
    });
  };

  render() {
    return (
      <Workbench>
        <Workbench.Header>
          <Workbench.Header.Back to="^.list" />
          <Workbench.Icon icon="page-settings" />
          <Workbench.Title>Apps: {this.props.app.title}</Workbench.Title>
          <Workbench.Header.Actions>
            {this.props.app.installed && (
              <Button buttonType="muted" onClick={this.onUninstallClick}>
                Uninstall
              </Button>
            )}
            {this.props.app.installed && (
              <Button
                buttonType="positive"
                loading={this.state.isBusy}
                onClick={this.onUpdateClick}>
                Update
              </Button>
            )}
            {!this.props.app.installed && (
              <Button
                buttonType="positive"
                loading={this.state.isBusy}
                onClick={this.onInstallClick}>
                Install
              </Button>
            )}
          </Workbench.Header.Actions>
        </Workbench.Header>
        <Workbench.Content centered>
          <h1>{this.props.app.title}</h1>
          <AppIcon appId={this.props.app.id} size="large" />
          {this.renderContent()}
          <NetlifyConfigEditor
            disabled={!this.state.token}
            siteConfigs={this.state.config.sites}
            netlifySites={this.state.netlifySites}
            onSiteConfigsChange={siteConfigs => {
              this.setState(state => ({
                ...state,
                config: { ...state.config, sites: siteConfigs }
              }));
            }}
          />
        </Workbench.Content>
      </Workbench>
    );
  }

  renderContent() {
    const { ticketId, token } = this.state;

    if (!ticketId) {
      return this.renderPreparing();
    }

    if (ticketId && !token) {
      return this.renderConnect();
    }

    return null;
  }

  renderPreparing() {
    return <p>Preparing connection to Netlify...</p>;
  }

  renderConnect() {
    return (
      <Button buttonType="positive" onClick={this.auth}>
        Connect Netlify
      </Button>
    );
  }
}
