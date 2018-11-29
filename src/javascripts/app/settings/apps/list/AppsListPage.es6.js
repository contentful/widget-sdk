import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Workbench from 'app/common/Workbench.es6';
import AppsList from './AppsList.es6';
import AppListItem from './AppListItem.es6';

export default class AppsListPage extends Component {
  static propTypes = {
    apps: PropTypes.array.isRequired
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
                <AppListItem key={app.id} app={app} />
              ))}
            </AppsList>
          )}
          {this.state.available.length > 0 && (
            <AppsList title="Available">
              {this.state.available.map(app => (
                <AppListItem key={app.id} app={app} />
              ))}
            </AppsList>
          )}
        </Workbench.Content>
      </Workbench>
    );
  }
}
