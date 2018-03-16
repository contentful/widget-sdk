import React from 'libs/react';
import PropTypes from 'libs/prop-types';
import {ProgressBar} from './ProgressBar';
import ContextMenu from 'ui/Components/ContextMenu';
import Icon from 'ui/Components/Icon';
import {go} from 'states/Navigator';

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

export const ResourceUsage = ({resource, name, description, path}) => {
  const menuItems = [];
  path && menuItems.push({
    label: 'Go to page',
    action: () => go({path})
  });

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
            {name}
            {description && <small className="resource-list__item__description"> {description}</small>}
          </h3>
        </div>

        <span className="resource-list__item__usage">
          {resource.usage}
          {resource.limits.maximum && ` out of ${resource.limits.maximum}`}
        </span>
        <ContextMenu items={menuItems} />
      </div>
      {resource.limits.maximum &&
        <ProgressBar current={resource.usage} maximum={resource.limits.maximum} />
      }
    </div>
  );
};
ResourceUsage.propTypes = {
  resource: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  path: PropTypes.array
};

export const ResourceUsageHighlight = ({resource, name, path}) => {
  const menuItems = [];
  path && menuItems.push({
    label: 'Go to page',
    action: () => go({path})
  });

  return (
    <div className="resource-list__item resource-list__item--highlight">
      <div className="resource-list__item__content">
        <Icon
          className="resource-list__item__icon"
          name={getIcon(resource.sys.id)}
        />
        <div>
          <span className="resource-list__item__usage">{resource.usage}</span>
          <span className="resource-list__item__title">{name}</span>
        </div>
        <div className="resource-list__item__menu">
          <ContextMenu items={menuItems} />
        </div>
      </div>
    </div>
  );
};
ResourceUsageHighlight.propTypes = {
  resource: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  path: PropTypes.array
};
