import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import * as ReloadNotification from 'ReloadNotification';
import createResourceService from 'services/ResourceService';
import moment from 'moment';

import {keyBy, property} from 'lodash';
import Workbench from 'app/WorkbenchReact';
import {ResourceUsage} from 'app/SpaceSettings/Usage/ResourceUsage';

const OrganizationResourceUsageList = ({resources}) => {
  if (!resources.length) return null;

  const formatDate = date => moment(date).format('DD MMMM');
  const byId = keyBy(resources, property('sys.id'));
  const {start, end} = byId['api_request'].period;
  const now = new Date();
  const daysLeft = moment(end).diff(now, 'days');
  const startDate = formatDate(start);
  const endDate = formatDate(end);

  return (
    <div className="resource-list">
      <ResourceUsage
        resource={byId['organization_membership']}
      />
      <div className="resource-list__title">
        <h3 className="section-title">Current billing period</h3>
        <p>{startDate} – {endDate} ({daysLeft} days remaining)</p>
      </div>
      <ResourceUsage
        resource={byId['api_request']}
        shortenIncluded={true}
      />
      <ResourceUsage
        resource={byId['asset_bandwidth']}
      />
    </div>
  );
};

OrganizationResourceUsageList.propTypes = {
  resources: PropTypes.arrayOf(PropTypes.object)
};

const OrganizationUsage = createReactClass({
  propTypes: {
    orgId: PropTypes.string.isRequired,
    onReady: PropTypes.func.isRequired,
    onForbidden: PropTypes.func.isRequired
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
    const {orgId, onReady} = this.props;
    const service = createResourceService(orgId, 'organization');
    let resources;

    try {
      resources = await service.getAll();
      onReady();
      this.setState({resources});
    } catch (e) {
      ReloadNotification.apiErrorHandler(e);
    }
  },

  render () {
    const {resources} = this.state;
    return (
      <Workbench
        icon="page-usage"
        testId="organization.usage"
        title="Usage"
        content={<OrganizationResourceUsageList resources={resources} />}
      />
    );
  }
});

export default OrganizationUsage;
