import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import * as ReloadNotification from 'ReloadNotification';
import createResourceService from 'services/ResourceService';

import Workbench from 'app/WorkbenchReact';
import ResourceUsageList from './ResourceUsageList';
import SpaceUsageSidebar from './SpaceUsageSidebar';

const SpaceUsage = createReactClass({
  propTypes: {
    orgId: PropTypes.string.isRequired,
    spaceId: PropTypes.string.isRequired
  },
  getInitialState () {
    return {
      resources: []
    };
  },
  componentDidMount () {
    this.fetchPlan();
  },

  async fetchPlan () {
    const {spaceId} = this.props;
    const service = createResourceService(spaceId);
    const isPermanent = resource => resource.kind === 'permanent';
    let resources;

    try {
      resources = await service.getAll();
      this.setState({resources: resources.filter(isPermanent)});
    } catch (e) {
      ReloadNotification.apiErrorHandler(e);
    }
  },

  render () {
    const {resources} = this.state;
    return (
      <Workbench
        title="Usage"
        testId="space.usage"
        content={<ResourceUsageList resources={resources} />}
        sidebar={<SpaceUsageSidebar resources={resources} />}
      />
    );
  }
});

export default SpaceUsage;
