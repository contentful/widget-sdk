import React from 'react';
import PropTypes from 'prop-types';

import {ResourceUsageHighlight, ResourceUsage} from './ResourceUsage';

const ResourceUsageList = ({resources}) =>
  (resources ? <div className="resource-list">
      <section className="resource-list__highlights">
        <ResourceUsageHighlight resource={resources['entry']} />
        <ResourceUsageHighlight resource={resources['asset']} />
        <ResourceUsageHighlight resource={resources['space_membership']} />
        <ResourceUsageHighlight resource={resources['environment']} showMaximumLimit />
      </section>

      <ResourceUsage resource={resources['content_type']}/>
      <ResourceUsage resource={resources['locale']}/>
      <ResourceUsage resource={resources['role']}/>
      <ResourceUsage resource={resources['record']} description="Entries + Media"/>
      <ResourceUsage resource={resources['api_key']}/>
      <ResourceUsage resource={resources['webhook_definition']}/>
    </div> : null
  );

ResourceUsageList.propTypes = {
  resources: PropTypes.object
};

export default ResourceUsageList;
