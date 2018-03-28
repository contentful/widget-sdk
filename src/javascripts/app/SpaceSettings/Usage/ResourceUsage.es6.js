import React from 'libs/react';
import PropTypes from 'libs/prop-types';
import {ProgressBar} from './ProgressBar';
import Icon from 'ui/Components/Icon';
import {resourceIncludedLimitReached, resourceHumanNameMap} from 'utils/ResourceUtils';

const iconsMap = {
  api_key: 'page-apis',
  space_membership: 'page-settings',
  content_type: 'page-ct',
  entry: 'page-content',
  asset: 'page-media',
  role: 'page-settings',
  locale: 'page-settings',
  webhook_definition: 'page-settings',
  environment: 'page-settings'
};

const getIcon = (id) => {
  return iconsMap[id] || 'page-settings';
};

export const ResourceUsage = ({
  resource,
  description,
  showOverages
}) => {
  const withUOM = (value) => {
    return resource.unitOfMeasure
      ? `${value} ${resource.unitOfMeasure}`
      : value;
  };

  return (
    <div className="resource-list__item">
      <div className="resource-list__item__content">
        <div className="resource-list__item__column">
          <Icon
            className="resource-list__item__icon"
            name={getIcon(resource.sys.id)}
            scale={0.5}
            />
          <h3 className="resource-list__item__title">
            {resourceHumanNameMap[resource.sys.id]}
            {description && <small className="resource-list__item__description"> {description}</small>}
          </h3>
        </div>

        <span className="resource-list__item__usage">
          {withUOM(resource.usage)}
          {resource.limits.maximum && ` out of ${withUOM(resource.limits.maximum)}`}
          {showOverages
            ? resourceIncludedLimitReached(resource)
              ? ` (${withUOM(resource.limits.included)} free +
                ${withUOM(resource.usage - resource.limits.included)} paid)`
              : ` out of ${withUOM(resource.limits.included)} included`
            : ''
          }
        </span>
      </div>
      {resource.limits.maximum &&
        <ProgressBar current={resource.usage} maximum={resource.limits.maximum} />
      }
    </div>
  );
};
ResourceUsage.propTypes = {
  resource: PropTypes.object.isRequired,
  description: PropTypes.string,
  showOverages: PropTypes.bool
};

export const ResourceUsageHighlight = ({resource}) => {
  return (
    <div className="resource-list__item resource-list__item--highlight">
      <div className="resource-list__item__content">
        <Icon
          className="resource-list__item__icon"
          name={getIcon(resource.sys.id)}
        />
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
