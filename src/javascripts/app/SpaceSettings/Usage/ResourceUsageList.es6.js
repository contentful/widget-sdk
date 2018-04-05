import React from 'libs/react';
import PropTypes from 'libs/prop-types';

import {keyBy, property} from 'lodash';
import {ResourceUsageHighlight, ResourceUsage} from './ResourceUsage';

const ResourceUsageList = ({resources}) => {
  if (!resources.length) return null;

  const byId = keyBy(resources, property('sys.id'));

  return (
    <div className="resource-list">
      <section className="resource-list__highlights">
        <ResourceUsageHighlight resource={byId['entry']} />
        <ResourceUsageHighlight resource={byId['asset']} />
        <ResourceUsageHighlight resource={byId['space_membership']} />
        <ResourceUsageHighlight resource={byId['environment']} />
      </section>

      <ResourceUsage resource={byId['content_type']} />
      <ResourceUsage resource={byId['locale']} />
      <ResourceUsage resource={byId['role']} />
      <ResourceUsage resource={byId['record']} description="Entries + Media" />
      <ResourceUsage resource={byId['api_key']} />
      <ResourceUsage resource={byId['webhook_definition']} />
    </div>
  );
};
ResourceUsageList.propTypes = {
  resources: PropTypes.arrayOf(PropTypes.object)
};

export default ResourceUsageList;
