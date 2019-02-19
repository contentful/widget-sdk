import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import Workbench from 'app/common/Workbench.es6';
import FeedbackButton from 'app/common/FeedbackButton.es6';
import AppsList from './AppsList.es6';
import AppListItem from './AppListItem.es6';
import {
  Note,
  Button,
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonText,
  SkeletonImage
} from '@contentful/forma-36-react-components';

import * as Analytics from 'analytics/Analytics.es6';
import * as Intercom from 'services/intercom.es6';

const styles = {
  container: css({
    maxWidth: '600px',
    margin: `${tokens.spacingXl} auto`
  }),
  intro: css({
    marginBottom: tokens.spacingL
  }),
  note: css({
    marginBottom: tokens.spacingL
  }),
  enableBtn: css({
    marginRight: tokens.spacingL
  })
};

const AppsListShell = props => (
  <Workbench>
    <Workbench.Header>
      <Workbench.Icon icon="page-apps" scale="1" />
      <Workbench.Title>Apps</Workbench.Title>
    </Workbench.Header>
    <Workbench.Content centered>
      <div className={styles.container}>
        <p className={styles.intro}>
          Extend the platform and integrate with services you’re using by adding apps.
        </p>
        <div>{props.children}</div>
      </div>
    </Workbench.Content>
  </Workbench>
);

const ItemSkeleton = props => (
  <React.Fragment>
    <SkeletonImage offsetTop={props.baseTop} width={36} height={36} radiusX={36} radiusY={36} />
    <SkeletonText offsetTop={props.baseTop + 15} offsetLeft={50} lineHeight={8} width={240} />
    <SkeletonText offsetTop={props.baseTop + 15} offsetLeft={510} lineHeight={8} width={90} />
  </React.Fragment>
);
ItemSkeleton.propTypes = {
  baseTop: PropTypes.number
};

export const AppsListPageLoading = () => {
  return (
    <AppsListShell>
      <SkeletonContainer svgWidth={600} svgHeight={200} ariaLabel="Loading apps list...">
        <SkeletonDisplayText />
        <ItemSkeleton baseTop={60} />
        <ItemSkeleton baseTop={110} />
        <ItemSkeleton baseTop={160} />
      </SkeletonContainer>
    </AppsListShell>
  );
};

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
    Intercom.trackEvent('apps-alpha-opted-in');
  };

  renderDisclaimer() {
    const { optedIn } = this.state;

    return (
      <Note extraClassNames={styles.note} noteType="primary" title="Alpha feature">
        <p>
          This is an experimental alpha feature. We are heavily iterating on it based on your
          feedback. Apps might stop working or get removed without notice so it’s recommended to not
          use apps in production. For more information{' '}
          <a
            href="https://www.contentful.com/developers/docs/extensibility/apps/"
            target="_blank"
            rel="noopener noreferrer">
            visit our documentation
          </a>
          .
        </p>
        <Button
          extraClassNames={styles.enableBtn}
          disabled={optedIn}
          onClick={this.optIn}
          icon={optedIn ? 'CheckCircle' : undefined}>
          {optedIn ? 'Apps enabled' : 'Enable alpha feature'}
        </Button>
        <FeedbackButton target="extensibility" about="Apps" type="Button" />
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
