import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import tokens from '@contentful/forma-36-tokens';
import {
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonText,
  SkeletonImage,
  Notification,
  Typography,
  Heading,
  Paragraph
} from '@contentful/forma-36-react-components';

import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import Icon from 'ui/Components/Icon.es6';
import AdminOnly from 'app/common/AdminOnly.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import * as Telemetry from 'i13n/Telemetry.es6';

import AppListItem from './AppListItem.es6';

const styles = {
  intro: css({
    marginBottom: tokens.spacingL
  }),
  list: css({
    marginBottom: tokens.spacing3Xl
  })
};

const AppsListShell = props => (
  <Workbench>
    <Workbench.Header title="Apps" icon={<Icon name="page-apps" scale="1" />} />
    <Workbench.Content type="text">
      <p className={styles.intro}>
        Extend the platform and integrate with services you’re using by adding Apps.
      </p>
      <div>{props.children}</div>
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

const AppsListPageLoading = () => {
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

const prepareApp = app => {
  return {
    id: app.sys.id,
    title: app.extensionDefinition.name,
    installed: !!app.extension
  };
};

export default class AppsListPage extends React.Component {
  static propTypes = {
    goToContent: PropTypes.func.isRequired,
    repo: PropTypes.shape({
      getApps: PropTypes.func.isRequired,
      getDevApps: PropTypes.func.isRequired
    }).isRequired
  };

  state = {};

  async componentDidMount() {
    try {
      const [apps, devApps] = await Promise.all([
        this.props.repo.getApps(),
        this.props.repo.getDevApps()
      ]);

      this.setState({
        ready: true,
        apps: apps.map(prepareApp),
        devApps: devApps.map(prepareApp)
      });
    } catch (err) {
      Telemetry.count('apps.list-loading-failed');
      Notification.error('Failed to load apps.');
      this.props.goToContent();
    }
  }

  render() {
    return (
      <AdminOnly>
        <DocumentTitle title="Apps" />
        {this.state.ready ? this.renderList() : <AppsListPageLoading />}
      </AdminOnly>
    );
  }

  renderList() {
    const { apps, devApps } = this.state;

    return (
      <AppsListShell>
        {apps.length > 0 && (
          <>
            <div className={styles.list}>
              {apps.map(app => (
                <AppListItem key={app.id} app={app} />
              ))}
            </div>
          </>
        )}
        {devApps.length > 0 && (
          <>
            <Typography>
              <Heading element="h2">Apps in development mode</Heading>
              <Paragraph>
                Apps that are currently in development in your organization. Please note that this
                list is just a list of <code>ExtensionDefinition</code> entities in your
                organization. Not all of them have to be Apps.
              </Paragraph>
            </Typography>
            <div className={styles.list}>
              {devApps.map(app => (
                <AppListItem key={app.id} app={app} />
              ))}
            </div>
          </>
        )}
      </AppsListShell>
    );
  }
}
