import React from 'react';
import PropTypes from 'prop-types';
import { ProgressBar } from './ProgressBar';
import {
  getResourceLimits,
  resourceIncludedLimitReached,
  resourceHumanNameMap
} from 'utils/ResourceUtils';
import { shorten, shortenStorageUnit } from 'utils/NumberUtils';

export const ResourceUsage = ({ resource, description, abbreviateLimit }) => {
  const { usage, unitOfMeasure } = resource;
  const limits = getResourceLimits(resource);

  // (1000) => "1 GB"
  // (1000, true) => "1k"
  // (1000) => "1,000"
  const toResourceFormat = (value, abbreviate) => {
    return unitOfMeasure
      ? shortenStorageUnit(value, unitOfMeasure)
      : abbreviate
        ? shorten(value, true)
        : value.toLocaleString('en-US');
  };

  // do not render if maximum is zero (i.e. roles in free spaces)
  if (limits.maximum === 0) {
    return null;
  }

  return (
    <div className="resource-list__item">
      <div className="resource-list__item__content">
        <div className="resource-list__item__column">
          <h3 className="resource-list__item__title">
            {resourceHumanNameMap[resource.sys.id]}
            {description && (
              <small className="resource-list__item__description"> {description}</small>
            )}
          </h3>
        </div>

        <span className="resource-list__item__usage">
          {toResourceFormat(usage)}
          {limits.maximum
            ? ` out of ${toResourceFormat(limits.maximum, abbreviateLimit)}`
            : limits.included
              ? resourceIncludedLimitReached(resource)
                ? ` (${toResourceFormat(limits.included)} free +
                    ${toResourceFormat(usage - limits.included)} paid)`
                : ` out of ${toResourceFormat(limits.included, abbreviateLimit)} included`
              : ''}
        </span>
      </div>
      {limits.maximum && <ProgressBar current={usage} maximum={limits.maximum} />}
    </div>
  );
};
ResourceUsage.propTypes = {
  resource: PropTypes.object.isRequired,
  description: PropTypes.string,
  abbreviateLimit: PropTypes.bool
};

export const ResourceUsageHighlight = ({ resource, showMaximumLimit }) => {
  return (
    <div className="resource-list__item resource-list__item--highlight">
      <div className="resource-list__item__usage">{`${resource.usage}${
        showMaximumLimit ? ` / ${getResourceLimits(resource).maximum}` : ''
      }`}</div>
      <div className="resource-list__item__title">{resourceHumanNameMap[resource.sys.id]}</div>
    </div>
  );
};
ResourceUsageHighlight.propTypes = {
  resource: PropTypes.object.isRequired,
  showMaximumLimit: PropTypes.bool
};

ResourceUsageHighlight.defaultProps = {
  showMaximumLimit: false
};
