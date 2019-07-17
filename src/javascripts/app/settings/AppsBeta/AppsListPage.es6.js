import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import tokens from '@contentful/forma-36-tokens';
import {
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonText,
  SkeletonImage,
  Notification
} from '@contentful/forma-36-react-components';

import Workbench from 'app/common/Workbench.es6';
import AdminOnly from 'app/common/AdminOnly.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import * as Telemetry from 'i13n/Telemetry.es6';

import AppListItem from './AppListItem.es6';

const styles = {
  container: css({
    maxWidth: '600px',
    margin: `${tokens.spacingXl} auto`
  }),
  intro: css({
    marginBottom: tokens.spacingL
  }),
  list: css({
    marginBottom: tokens.spacing3Xl
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
          Extend the platform and integrate with services you’re using by adding Apps.
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

export default class AppsListPage extends React.Component {
  static propTypes = {
    goToContent: PropTypes.func.isRequired,
    repo: PropTypes.shape({
      getApps: PropTypes.func.isRequired
    }).isRequired
  };

  state = {};

  async componentDidMount() {
    try {
      const apps = await this.props.repo.getApps();

      this.setState({
        apps: apps.map(app => ({
          id: app.sys.id,
          title: app.extensionDefinition.name,
          installed: !!app.extension
        }))
      });
    } catch (err) {
      Telemetry.count('apps.list-loading-failed');
      Notification.error('Failed to load apps.');
      this.props.goToContent();
    }
  }

  render() {
    const { apps } = this.state;

    return (
      <AdminOnly>
        <DocumentTitle title="Apps" />
        {apps ? this.renderList(apps) : <AppsListPageLoading />}
      </AdminOnly>
    );
  }

  renderList(apps) {
    return (
      <AppsListShell>
        <div className={styles.list}>
          {apps.map(app => (
            <AppListItem key={app.id} app={app} />
          ))}
        </div>
      </AppsListShell>
    );
  }
}
