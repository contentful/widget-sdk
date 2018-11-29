import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import AppIcon from '../_common/AppIcon.es6';
import AppUninstallDialog from '../dialogs/AppUninstallDialog.es6';

export default class AlgoliaPage extends Component {
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
    this.state = {
      isBusy: false,
      config: JSON.stringify(props.app.config, null, 2)
    };
  }

  parseConfig = () => {
    try {
      return JSON.parse(this.state.config);
    } catch (err) {
      throw new Error('Configuration could not be parsed.');
    }
  };

  onInstallClick = async () => {
    const config = this.parseConfig();

    this.setState({ isBusy: true });

    // DO SOME APP-SPECIFIC SETUP
    // for example CREATE Contentful to Algolia webhooks

    await this.props.onInstall(this.props.app.id, config);
  };

  onUpdateClick = async () => {
    const config = this.parseConfig();

    this.setState({ isBusy: true });

    // DO SOME APP-SPECIFIC SETUP
    // for example UPDATE Contentful to Algolia webhooks

    await this.props.onInstall(this.props.app.id, config);
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
          <textarea
            rows={10}
            cols={50}
            style={{ fontFamily: 'monospace', display: 'block' }}
            onChange={e => this.setState({ config: e.target.value })}
            value={this.state.config}
          />
        </Workbench.Content>
      </Workbench>
    );
  }
}
