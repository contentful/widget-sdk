import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import Workbench from 'app/common/Workbench.es6';
import AdminOnly from 'app/common/AdminOnly.es6';
import AppsList from './AppsList.es6';
import AppListItem from './AppListItem.es6';
import {
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonText,
  SkeletonImage
} from '@contentful/forma-36-react-components';
import DocumentTitle from 'components/shared/DocumentTitle.es6';

const styles = {
  container: css({
    maxWidth: '600px',
    margin: `${tokens.spacingXl} auto`
  }),
  intro: css({
    marginBottom: tokens.spacingL
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

const apps = [
  {
    id: 'netlify',
    title: 'Netlify'
  }
];

export default function AppsListPage() {
  return (
    <AdminOnly>
      <AppsListShell>
        <DocumentTitle title="Apps" />
        <AppsList>
          {apps.map(app => (
            <AppListItem key={app.id} app={app} />
          ))}
        </AppsList>
      </AppsListShell>
    </AdminOnly>
  );
}
