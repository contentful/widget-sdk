import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import Workbench from 'app/common/Workbench.es6';
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
  }),
  note: css({
    marginBottom: tokens.spacingL
  }),
  enableBtn: css({
    marginRight: tokens.spacingL
  })
};

const JobsListShell = props => (
  <Workbench>
    <Workbench.Header>
      <Workbench.Icon icon="arrow-up" scale="1" />
      <Workbench.Title>Jobs</Workbench.Title>
    </Workbench.Header>
    <Workbench.Content centered>
      <div className={styles.container}>
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

export const JobsListPageLoading = () => {
  return (
    <JobsListShell>
      <SkeletonContainer svgWidth={600} svgHeight={200} ariaLabel="Loading jobs list...">
        <SkeletonDisplayText />
        <ItemSkeleton baseTop={60} />
        <ItemSkeleton baseTop={110} />
        <ItemSkeleton baseTop={160} />
      </SkeletonContainer>
    </JobsListShell>
  );
};

export default class JobsListPage extends Component {
  static propTypes = {
    jobs: PropTypes.array.isRequired
  };

  render() {
    return (
      <JobsListShell>
        <DocumentTitle title="Jobs" />
        {this.renderJobs()}
      </JobsListShell>
    );
  }

  renderJobs() {
    return null;
  }
}
