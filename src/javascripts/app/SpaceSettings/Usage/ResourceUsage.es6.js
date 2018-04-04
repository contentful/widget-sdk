import React from 'libs/react';
import PropTypes from 'libs/prop-types';
import {ProgressBar} from './ProgressBar';
import {resourceIncludedLimitReached, resourceHumanNameMap} from 'utils/ResourceUtils';
import {shorten, shortenStorageUnit} from 'utils/NumberUtils';

export const ResourceUsage = ({
  resource,
  description,
  showOverages,
  shortenIncluded
}) => {
  const {usage, limits, unitOfMeasure} = resource;

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

  return (
    <div className="resource-list__item">
      <div className="resource-list__item__content">
        <div className="resource-list__item__column">
          <h3 className="resource-list__item__title">
            {resourceHumanNameMap[resource.sys.id]}
            {description && <small className="resource-list__item__description"> {description}</small>}
          </h3>
        </div>

        <span className="resource-list__item__usage">
          {toResourceFormat(usage)}
          {limits.maximum && ` out of ${toResourceFormat(limits.maximum)}`}
          {showOverages
            ? resourceIncludedLimitReached(resource)
              ? ` (${toResourceFormat(limits.included)} free +
                  ${toResourceFormat(usage - limits.included)} paid)`
              : ` out of ${toResourceFormat(limits.included, shortenIncluded)} included`
            : ''
          }
        </span>
      </div>
      {limits.maximum &&
        <ProgressBar current={usage} maximum={limits.maximum} />
      }
    </div>
  );
};
ResourceUsage.propTypes = {
  resource: PropTypes.object.isRequired,
  description: PropTypes.string,
  showOverages: PropTypes.bool,
  shortenIncluded: PropTypes.bool
};

export const ResourceUsageHighlight = ({resource}) => {
  return (
    <div className="resource-list__item resource-list__item--highlight">
      <div className="resource-list__item__content">
        <div>
          <span className="resource-list__item__usage">{resource.usage}</span>
          <span className="resource-list__item__title">{resourceHumanNameMap[resource.sys.id]}</span>
        </div>
      </div>
    </div>
  );
};
ResourceUsageHighlight.propTypes = {
  resource: PropTypes.object.isRequired
};
