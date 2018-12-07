import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ContentLoader from 'react-content-loader';
import Workbench from 'app/common/Workbench.es6';
import AppsList from './AppsList.es6';
import AppListItem from './AppListItem.es6';
import IntercomFeedback from '../IntercomFeedback.es6';
import { Note, Button } from '@contentful/forma-36-react-components';

import * as Analytics from 'analytics/Analytics.es6';
import intercom from 'intercom';

const AppsListShell = props => (
  <Workbench>
    <Workbench.Header>
      <Workbench.Icon icon="page-apps" scale="1" />
      <Workbench.Title>Apps</Workbench.Title>
    </Workbench.Header>
    <Workbench.Content centered>
      <div className="apps-list-container">
        <p className="apps-list__intro">
          Extend the platform and integrate with services you’re using by adding apps.
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

const appGroupPropType = PropTypes.arrayOf(
  PropTypes.shape({
    id: PropTypes.string.isRequired
  })
).isRequired;

export default class AppsListPage extends Component {
  static propTypes = {
    apps: PropTypes.shape({
      installed: appGroupPropType,
      available: appGroupPropType
    }).isRequired
  };

  constructor(props) {
    super(props);
    this.state = { optedIn: props.apps.installed.length > 0 };
  }

  render() {
    return (
      <AppsListShell>
        {this.renderDisclaimer()}
        {this.renderApps()}
      </AppsListShell>
    );
  }

  optIn = () => {
    this.setState({ optedIn: true });

    Analytics.track('apps:opted_in');

    // Track event so the user is identified in Intercom.
    intercom.trackEvent('apps-early-access');
  };

  renderDisclaimer() {
    const { optedIn } = this.state;

    return (
      <Note extraClassNames="netlify-app__early-access" noteType="primary" title="Alpha feature">
        <p>
          This is not a commercial release. It may contain errors and may change how it works. Use
          this only on things that are not business critical.
        </p>
        <Button disabled={optedIn} onClick={this.optIn} icon={optedIn ? 'CheckCircle' : undefined}>
          {optedIn ? 'Apps enabled' : 'Enable alpha feature'}
        </Button>
        <IntercomFeedback about="Apps" type="Button" />
      </Note>
    );
  }

  renderApps() {
    const { apps } = this.props;
    const overlayed = !this.state.optedIn;

    return (
      <React.Fragment>
        {apps.installed.length > 0 && (
          <AppsList title="Installed" overlayed={overlayed}>
            {apps.installed.map(app => (
              <AppListItem key={app.id} app={app} />
            ))}
          </AppsList>
        )}
        {apps.available.length > 0 && (
          <AppsList title="Available" overlayed={overlayed}>
            {apps.available.map(app => (
              <AppListItem key={app.id} app={app} />
            ))}
          </AppsList>
        )}
      </React.Fragment>
    );
  }
}
