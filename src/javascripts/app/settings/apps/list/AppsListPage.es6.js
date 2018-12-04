import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ContentLoader from 'react-content-loader';
import Workbench from 'app/common/Workbench.es6';
import AppsList from './AppsList.es6';
import AppListItem from './AppListItem.es6';

const AppsListShell = props => (
  <Workbench>
    <Workbench.Header>
      <Workbench.Icon icon="page-settings" />
      <Workbench.Title>Apps</Workbench.Title>
    </Workbench.Header>
    <Workbench.Content centered>
      <div className="apps-list-container">
        <p className="apps-list__intro">
          Adding apps helps you extend the platform and work easier with a service you are using for
          your project.
        </p>
        <div>{props.children}</div>
      </div>
    </Workbench.Content>
  </Workbench>
);

export const AppsListPageLoading = () => (
  <AppsListShell>
    <ContentLoader height={200} width={500} ariaLabel="Loading apps list...">
      <rect x="0" y="0" rx="2" ry="2" width="100" height="10" />
      <circle cx="15" cy="55" r="15" />
      <rect x="45" y="52" rx="2" ry="2" width="200" height="6" />
      <rect x="430" y="52" rx="2" ry="2" width="70" height="6" />

      <circle cx="15" cy="95" r="15" />
      <rect x="45" y="92" rx="2" ry="2" width="200" height="6" />
      <rect x="430" y="92" rx="2" ry="2" width="70" height="6" />

      <circle cx="15" cy="135" r="15" />
      <rect x="45" y="132" rx="2" ry="2" width="200" height="6" />
      <rect x="430" y="132" rx="2" ry="2" width="70" height="6" />
    </ContentLoader>
  </AppsListShell>
);

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
      <AppsListShell>
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
      </AppsListShell>
    );
  }
}
