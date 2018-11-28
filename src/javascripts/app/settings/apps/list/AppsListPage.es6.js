import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Workbench from 'app/common/Workbench.es6';
import AppsList from './AppsList.es6';
import AppListItem from './AppListItem.es6';
import AppUninstallDialog from '../dialogs/AppUninstallDialog.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';

export default class AppsListPage extends Component {
  static propTypes = {
    apps: PropTypes.array.isRequired,
    onUninstall: PropTypes.func.isRequired
  };

  state = {
    installed: [],
    available: []
  };

  static getDerivedStateFromProps(props) {
    const installed = [];
    const available = [];
    props.apps.forEach(app => {
      if (app.installed) {
        installed.push(app);
      } else {
        available.push(app);
      }
    });
    return {
      installed,
      available
    };
  }

  onUninstallClick = async app => {
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
          <Workbench.Icon icon="page-settings" />
          <Workbench.Title>Apps</Workbench.Title>
        </Workbench.Header>
        <Workbench.Content centered>
          {this.state.installed.length > 0 && (
            <AppsList title="Installed">
              {this.state.installed.map(app => (
                <AppListItem key={app.id} app={app} onUninstallClick={this.onUninstallClick} />
              ))}
            </AppsList>
          )}
          {this.state.available.length > 0 && (
            <AppsList title="Available">
              {this.state.available.map(app => (
                <AppListItem key={app.id} app={app} onUninstallClick={this.onUninstallClick} />
              ))}
            </AppsList>
          )}
        </Workbench.Content>
      </Workbench>
    );
  }
}
