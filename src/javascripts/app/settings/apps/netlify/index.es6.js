import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@contentful/ui-component-library';
import Workbench from 'app/common/Workbench.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import AppIcon from '../_common/AppIcon.es6';
import StateLink from 'app/common/StateLink.es6';
import AppUninstallDialog from '../dialogs/AppUninstallDialog.es6';

export default class NetlifyPage extends Component {
  static propTypes = {
    app: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      installed: PropTypes.bool.isRequired
    }).isRequired,
    onInstall: PropTypes.func.isRequired,
    onUninstall: PropTypes.func.isRequired
  };

  state = {
    isBusy: false
  };

  onInstallClick = async () => {
    this.setState({ isBusy: true });
    await this.props.onInstall(this.props.app.id);
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
            <StateLink to="^.list">
              {props => (
                <Button buttonType="muted" onClick={props.onClick}>
                  Close
                </Button>
              )}
            </StateLink>
            {!this.props.app.installed && (
              <Button
                buttonType="positive"
                loading={this.state.isBusy}
                onClick={this.onInstallClick}>
                Install
              </Button>
            )}
            {this.props.app.installed && (
              <Button
                buttonType="muted"
                loading={this.state.isBusy}
                onClick={this.onUninstallClick}>
                Uninstall
              </Button>
            )}
          </Workbench.Header.Actions>
        </Workbench.Header>
        <Workbench.Content centered>
          <h1>{this.props.app.title}</h1>
          <AppIcon appId={this.props.app.id} size="large" />
        </Workbench.Content>
      </Workbench>
    );
  }
}
