import React from 'libs/react';
import PropTypes from 'libs/prop-types';

import {highlightedResources, resourcesByPriority} from './SpaceUsageConfig';
import {ResourceUsageHighlight, ResourceUsage} from './ResourceUsage';

const ResourceUsageList = ({resources}) => {
  const findById = id => resources.find(item => item.sys.id === id);

  if (!resources || !resources.length) return null;

  return (
    <div className="resource-list">
      <section className="resource-list__highlights">
        {highlightedResources.map(item =>
          <ResourceUsageHighlight
            key={item.id}
            resource={findById(item.id)}
            {...item}
          />
        )}
      </section>
      {resourcesByPriority.map(item =>
        <ResourceUsage
          key={item.id}
          resource={findById(item.id)}
          {...item}
        />
      )}
    </div>
  );
};
ResourceUsageList.propTypes = {
  resources: PropTypes.arrayOf(PropTypes.object)
};

export default ResourceUsageList;
