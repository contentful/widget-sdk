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
import $state from '$state';

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
    if (this.cancel) {
      this.cancel();
    }
  }

  auth = () => {
    this.cancel = NetlifyClient.getAccessTokenWithTicket(this.props.ticketId, (err, token) => {
      if (err) {
        this.setState({ err });
      } else if (token) {
        NetlifyClient.listSites(token).then(
          netlifySites => this.setState({ token, netlifySites }),
          err => this.setState({ err })
        );
      }
    });
  };

  onInstallClick = async () => {
    this.setState({ busyWith: 'install' });

    // DO SOME APP-SPECIFIC SETUP
    // for example create Netlify webhooks

    await this.props.client.save(this.props.app.id, this.state.config);
    this.setState({ busyWith: false, installed: true });
  };

  onUpdateClick = async () => {
    this.setState({ busyWith: 'update' });

    // DO SOME APP-SPECIFIC SETUP
    // for example update Netlify webhooks

    await this.props.client.save(this.props.app.id, this.state.config);
    this.setState({ busyWith: false, installed: true });
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

    if (confirmed) {
      this.setState({ busyWith: 'uninstall' });
      // DO THE CLEANUP
      await this.props.client.remove(this.props.app.id);
      $state.go('^.list');
    }
  };

  render() {
    return (
      <Workbench>
        <Workbench.Header>
          <Workbench.Header.Back to="^.list" />
          <Workbench.Icon icon="page-settings" />
          <Workbench.Title>Apps: {this.props.app.title}</Workbench.Title>
          <Workbench.Header.Actions>
            {this.state.installed && (
              <Button
                buttonType="muted"
                disabled={!!this.state.busyWith}
                loading={this.state.busyWith === 'uninstall'}
                onClick={this.onUninstallClick}>
                Uninstall
              </Button>
            )}
            {this.state.installed && (
              <Button
                buttonType="positive"
                disabled={!!this.state.busyWith}
                loading={this.state.busyWith === 'update'}
                onClick={this.onUpdateClick}>
                Update
              </Button>
            )}
            {!this.state.installed && (
              <Button
                buttonType="positive"
                disabled={!!this.state.busyWith}
                loading={this.state.busyWith === 'install'}
                onClick={this.onInstallClick}>
                Install
              </Button>
            )}
          </Workbench.Header.Actions>
        </Workbench.Header>
        <Workbench.Content centered>
          <h1>{this.props.app.title}</h1>
          <AppIcon appId={this.props.app.id} size="large" />

          {!this.state.token && (
            <Button buttonType="positive" onClick={this.auth}>
              Connect Netlify
            </Button>
          )}

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
}
