import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ContentLoader from 'react-content-loader';
import Workbench from 'app/common/Workbench.es6';
import AppsList from './AppsList.es6';
import AppListItem from './AppListItem.es6';
import IntercomFeedback from '../IntercomFeedback.es6';
import { Note, TextLink } from '@contentful/forma-36-react-components';

const AppsListShell = props => (
  <Workbench>
    <Workbench.Header>
      <Workbench.Icon icon="page-settings" />
      <Workbench.Title>Apps</Workbench.Title>
      <Workbench.Header.Actions>
        <IntercomFeedback about="Apps" />
      </Workbench.Header.Actions>
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

const FakeListContent = () => (
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
);

export const AppsListPageLoading = () => (
  <AppsListShell>
    <FakeListContent />
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
      <AppsListShell>{this.state.optedIn ? this.renderApps() : this.renderOptIn()}</AppsListShell>
    );
  }

  renderOptIn() {
    return (
      <React.Fragment>
        <Note
          extraClassNames="netlify-app__early-access"
          noteType="primary"
          title="Early Access Program">
          <p>
            Apps are under active development right now and should not be used in production systems
            yet. We decided to make them available to interested parties but we warn you: it may be
            broken.
          </p>
          <TextLink onClick={() => this.setState({ optedIn: true })} icon="ThumbUp">
            I want to join the Early Access Program
          </TextLink>
        </Note>
        <FakeListContent />
      </React.Fragment>
    );
  }

  renderApps() {
    const { apps } = this.props;

    return (
      <React.Fragment>
        {apps.installed.length > 0 && (
          <AppsList title="Installed">
            {apps.installed.map(app => (
              <AppListItem key={app.id} app={app} />
            ))}
          </AppsList>
        )}
        {apps.available.length > 0 && (
          <AppsList title="Available">
            {apps.available.map(app => (
              <AppListItem key={app.id} app={app} />
            ))}
          </AppsList>
        )}
      </React.Fragment>
    );
  }
}
