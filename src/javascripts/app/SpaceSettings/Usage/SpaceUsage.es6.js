import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import * as ReloadNotification from 'ReloadNotification';
import Workbench from 'app/WorkbenchReact';
import Icon from 'ui/Components/Icon';
import createResourceService from 'services/ResourceService';
import {byName as colors} from 'Styles/Colors';

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

const ProgressBar = ({current, maximum}) => {
  const percentual = 100 / maximum * current;
  const width = `${Math.min(percentual, 100)}%`;
  const getColor = (percentual) => {
    if (percentual >= 100) {
      return colors.redLight;
    } else if (percentual > 75) {
      return colors.orangeLight;
    }
    return colors.greenLight;
  };

  return (
    <div className="progress-bar">
      <span
        className="progress-bar__current"
        style={{width, backgroundColor: getColor(percentual)}}
      ></span>
    </div>
  );
};
ProgressBar.propTypes = {
  current: PropTypes.number.isRequired,
  maximum: PropTypes.number.isRequired
};

const ResourceUsage = ({resource}) => {
  const getIcon = (id) => {
    return iconsMap[id] || 'page-settings';
  };

  return (
    <div className="resource-list__item">
      <div className="resource-list__item__content">
        <Icon
          className="resource-list__item__icon"
          name={getIcon(resource.sys.id)}
          scale="0.5"
        />
        <h3 className="resource-list__item__title">{resource.name}</h3>
        <span className="resource-list__item__usage">
          {resource.usage}
          {resource.limits.maximum && ` out of ${resource.limits.maximum}`}
        </span>
      </div>
      {resource.limits.maximum &&
        <ProgressBar current={resource.usage} maximum={resource.limits.maximum} />
      }
    </div>
  );
};
ResourceUsage.propTypes = {
  resource: PropTypes.object.isRequired
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
        icon="subscription"
        content={
          <div style={{padding: '2rem 3.15rem'}}>
            {resources.map(resource => <ResourceUsage resource={resource} key={resource.sys.id} />)}
          </div>
        }
        sidebar={
          <div className="entity-sidebar">
            <p><a href="">Fair usage limits apply</a></p>

            <h3 className="entity-sidebar__heading">Need help?</h3>
            <p>{'Do you need help to up- or downgrade? Don\'t hesitate to talk to one of our customer success team'}</p>
          </div>
        }
      />
    );
  }
});

export default SpaceUsage;
