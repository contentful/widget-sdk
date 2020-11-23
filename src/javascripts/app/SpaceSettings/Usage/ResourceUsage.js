import React from 'react';
import PropTypes from 'prop-types';
import { ProgressBar } from './ProgressBar';
import * as ResourceUtils from 'utils/ResourceUtils';
import { Subheading } from '@contentful/forma-36-react-components';

export const ResourceUsage = ({ usage, description, entitlement, name }) => {
  // do not render if maximum is zero (i.e. roles in free spaces)
  if (entitlement === 0) {
    return null;
  }

  return (
    <div className="resource-list__item" data-test-id="resource-usage-list-item">
      <div className="resource-list__item__content">
        <div className="resource-list__item__column">
          <Subheading className="resource-list__item__title">
            {name}
            {description && (
              <small className="resource-list__item__description"> {description}</small>
            )}
          </Subheading>
        </div>

        <span className="resource-list__item__usage">
          {usage}
          <span data-test-id={name}>{entitlement && ` out of ${entitlement}`}</span>
        </span>
      </div>
      {entitlement && <ProgressBar current={usage} maximum={entitlement} />}
    </div>
  );
};

ResourceUsage.propTypes = {
  usage: PropTypes.number,
  description: PropTypes.string,
  entitlement: PropTypes.number,
  name: PropTypes.string,
};

export const ResourceUsageHighlight = ({ resource, showMaximumLimit }) => {
  return (
    <div className="resource-list__item resource-list__item--highlight">
      <div className="resource-list__item__usage">{`${resource.usage}${
        showMaximumLimit ? ` / ${ResourceUtils.getResourceLimits(resource)}` : ''
      }`}</div>
      <div className="resource-list__item__title">
        {ResourceUtils.resourceHumanNameMap[resource.sys.id]}
      </div>
    </div>
  );
};

ResourceUsageHighlight.propTypes = {
  resource: PropTypes.object.isRequired,
  showMaximumLimit: PropTypes.bool,
};

ResourceUsageHighlight.defaultProps = {
  showMaximumLimit: false,
};
