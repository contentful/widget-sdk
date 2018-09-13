import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import { keyBy, property } from 'lodash';
import { ResourceUsage } from 'app/SpaceSettings/Usage/ResourceUsage.es6';

export default class OrganizationResourceUsageList extends React.Component {
  static propTypes = {
    resources: PropTypes.arrayOf(PropTypes.object)
  };

  render() {
    const { resources } = this.props;
    if (!resources.length) return null;

    const formatDate = date => moment(date).format('DD MMMM');

    const byId = keyBy(resources, property('sys.id'));
    const { start, end } = byId['api_request'].period;
    const nowNormalized = moment.utc(new Date().toDateString(), 'ddd MMM DD YYYY');
    const daysLeft = moment(end).diff(nowNormalized, 'days');
    const startDate = formatDate(start);
    const endDate = formatDate(end);

    return (
      <div className="resource-list">
        <ResourceUsage resource={byId['organization_membership']} />
        <div className="resource-list__title">
          <h3 className="section-title">Current billing period</h3>
          <p>
            {startDate} – {endDate} ({daysLeft} days remaining)
          </p>
        </div>
        <ResourceUsage resource={byId['api_request']} abbreviateLimit={true} />
        <ResourceUsage resource={byId['asset_bandwidth']} />
      </div>
    );
  }
}
