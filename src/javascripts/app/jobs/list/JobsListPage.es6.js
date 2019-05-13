import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Workbench from 'app/common/Workbench.es6';
import {
  SkeletonContainer,
  SkeletonText,
  Tabs,
  Tab,
  TabPanel
} from '@contentful/forma-36-react-components';
import JobsTable from './JobsTable.es6';

import DocumentTitle from 'components/shared/DocumentTitle.es6';

const JobsListShell = props => (
  <Workbench>
    <Workbench.Header>
      <Workbench.Icon icon="field-calendar" scale="1" />
      <Workbench.Title>Jobs Schedule</Workbench.Title>
    </Workbench.Header>
    <Workbench.Content className="f36-padding--xl">
      <div>{props.children}</div>
    </Workbench.Content>
  </Workbench>
);

const ItemSkeleton = props => (
  <React.Fragment>
    <SkeletonText offsetTop={props.baseTop} offsetLeft="1%" lineHeight={8} width="18%" />
    <SkeletonText offsetTop={props.baseTop} offsetLeft="21%" lineHeight={8} width="18%" />
    <SkeletonText offsetTop={props.baseTop} offsetLeft="41%" lineHeight={8} width="18%" />
    <SkeletonText offsetTop={props.baseTop} offsetLeft="61%" lineHeight={8} width="18%" />
    <SkeletonText offsetTop={props.baseTop} offsetLeft="81%" lineHeight={8} width="18%" />
  </React.Fragment>
);
ItemSkeleton.propTypes = {
  baseTop: PropTypes.number
};

export const JobsListPageLoading = () => {
  return (
    <JobsListShell>
      <SkeletonContainer svgWidth="100%" svgHeight={200} ariaLabel="Loading jobs list...">
        <SkeletonText offsetTop={0} offsetLeft={0} lineHeight={20} width="18%" />
        <SkeletonText offsetTop={0} offsetLeft="20%" lineHeight={20} width="18%" />
        <SkeletonText offsetTop={0} offsetLeft="40%" lineHeight={20} width="18%" />
        <SkeletonText offsetTop={40} offsetLeft={0} lineHeight={40} width="100%" />
        <ItemSkeleton baseTop={100} />
        <ItemSkeleton baseTop={130} />
        <ItemSkeleton baseTop={160} />
      </SkeletonContainer>
    </JobsListShell>
  );
};

export default class JobsListPage extends Component {
  static propTypes = {
    jobs: PropTypes.array
  };

  tabs = {
    scheduledJobs: {
      title: 'Scheduled Jobs',
      description: 'A list of entries scheduled to change status.',
      jobs: this.props.jobs.filter(job => job.sys.status === 'pending')
    },
    completedJobs: {
      title: 'Completed Jobs',
      description: 'A list of completed jobs.',
      jobs: this.props.jobs.filter(
        job => job.sys.status === 'success' || job.sys.status === 'cancelled'
      )
    },
    erroredJobs: {
      title: 'Errored Jobs',
      description: 'A list of errored jobs.',
      jobs: this.props.jobs.filter(job => job.sys.status === 'error')
    }
  };

  state = {
    activeTab: 'scheduledJobs'
  };

  render() {
    return (
      <JobsListShell>
        <DocumentTitle title="Jobs Schedule" />
        {this.renderJobs()}
      </JobsListShell>
    );
  }

  renderTabNavigation = () => (
    <Tabs>
      {Object.keys(this.tabs).map(key => (
        <Tab
          key={key}
          selected={this.state.activeTab === key}
          id={key}
          onSelect={id => this.setState({ activeTab: id })}>
          {this.tabs[key].title}
        </Tab>
      ))}
    </Tabs>
  );

  renderJobs() {
    const { activeTab } = this.state;
    return (
      <div>
        {this.renderTabNavigation()}
        <TabPanel className="f36-padding-top--l" id={activeTab}>
          <JobsTable
            description={this.tabs[activeTab].description}
            jobs={this.tabs[activeTab].jobs}
          />
        </TabPanel>
      </div>
    );
  }
}
