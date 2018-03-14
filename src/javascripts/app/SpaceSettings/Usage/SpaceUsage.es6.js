import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import * as ReloadNotification from 'ReloadNotification';
import Workbench from 'app/WorkbenchReact';
import Icon from 'ui/Components/Icon';
import ContextMenu from 'ui/Components/ContextMenu';
import createResourceService from 'services/ResourceService';
import {go} from 'states/Navigator';
import {resourceMaximumLimitReached} from 'utils/ResourceUtils';
import {supportUrl} from 'Config';
import * as Intercom from 'intercom';
import {byName as colors} from 'Styles/Colors';

import {highlightedResources, resourcesByPriority} from './SpaceUsageConfig';
import {ProgressBar} from './ProgressBar';


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

const ResourceUsage = ({resource, name, description, path}) => {
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

const ResourceUsageHighlight = ({resource, name, path}) => {
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

const ResourceUsageList = ({resources}) => {
  const findById = id => resources.find(item => item.sys.id === id);

  return (
    resources && resources.length
    ? <div className="resource-list">
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
    : ''
  );
};
ResourceUsageList.propTypes = {
  resources: PropTypes.arrayOf(PropTypes.object)
};

const SpaceUsageSidebar = ({resources}) => {
  const limitsReached = resources
    .filter(resourceMaximumLimitReached)
    .map(resource => {
      return [...highlightedResources, ...resourcesByPriority]
        .find(item => item.id === resource.sys.id)
        .name;
    });

  const contactUs = () => {
    // Open intercom if it's possible, otherwise go to support page.
    if (Intercom.isEnabled()) {
      Intercom.open();
    } else {
      window.open(supportUrl);
    }
  };

  return (
    <div className="entity-sidebar">
      <p>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.contentful.com/developers/docs/technical-limits/"
        >Technical limits apply</a>
      </p>

      {limitsReached.length
        ? <p className="note-box--info">
            You have reached the limit for
            {limitsReached.length > 2
              ? ' a few of your space resources. '
              : ` ${limitsReached.join(' and ')}. `
            }
            Consider upgrading your space plan.
          </p>
        : ''
      }

      <h3 className="entity-sidebar__heading">Need help?</h3>
      <p className="entity-sidebar__help-text">
        {`Do you need help to up- or downgrade?
        Don't hesitate to our customer success team.`}
      </p>
      <p>
        <Icon
          name="bubble"
          style={{
            fill: colors.blueDarkest,
            paddingRight: '6px',
            position: 'relative',
            bottom: '-0.125em'
          }}
        />
        <button
          onClick={contactUs}
          className="text-link"
        >Get in touch with us</button>
      </p>
    </div>
  );
};
SpaceUsageSidebar.propTypes = {
  resources: PropTypes.arrayOf(PropTypes.object)
};

const SpaceUsage = createReactClass({
  propTypes: {
    orgId: PropTypes.string.isRequired,
    spaceId: PropTypes.string.isRequired
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
    const {spaceId} = this.props;
    const service = createResourceService(spaceId);
    const isPermanent = resource => resource.kind === 'permanent';
    const resources = await service.getAll().catch(ReloadNotification.apiErrorHandler);
    this.setState({resources: resources.filter(isPermanent)});
  },

  render () {
    const {resources} = this.state;
    return (
      <Workbench
        title="Usage"
        content={<ResourceUsageList resources={resources} />}
        sidebar={<SpaceUsageSidebar resources={resources} />}
      />
    );
  }
});

export default SpaceUsage;
