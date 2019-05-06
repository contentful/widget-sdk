import React from 'react';
import PropTypes from 'prop-types';

import ContactUsButton from 'ui/Components/ContactUsButton.es6';
import { resourceMaximumLimitReached, resourceHumanNameMap } from 'utils/ResourceUtils.es6';

// Return a list with the names of the resources that reached the limit
const getLimitsReachedResources = resources => {
  return Object.values(resources)
    .filter(resourceMaximumLimitReached)
    .map(resource => resourceHumanNameMap[resource.sys.id]);
};

const limitsReachedMessage = (spaceResources, envResources, envId) => {
  if (spaceResources.length > 0) {
    return (
      <p className="note-box--info">
        You have reached the limit for
        {spaceResources.length > 2
          ? ' a few of your space resources'
          : ` ${spaceResources.join(' and ')}`}
        {envResources.length > 0
          ? `, and other limits in your ${envId} environment. `
          : '. '}
        Consider upgrading your space plan.
      </p>
    );
  } else if (envResources.length > 0) {
    return (
      <p className="note-box--info">
        You have reached the limit for
        {envResources.length > 2
          ? ` a few resources `
          : ` ${envResources.join(' and ')} `}
        in your {envId} environment. Consider upgrading your space plan.
      </p>
    )
  } else return '';
}

const SpaceUsageSidebar = (props) => {
  console.log({props})
  const { spaceResources, envResources, environmentId} = props
  const limitsReachedSpaceResources = getLimitsReachedResources(spaceResources);
  const limitsReachedEnvResources = getLimitsReachedResources(envResources);

  return (
    <div className="entity-sidebar">
      <p>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.contentful.com/developers/docs/technical-limits/">
          Technical limits apply
        </a>
      </p>

      {limitsReachedMessage(limitsReachedSpaceResources, limitsReachedEnvResources, environmentId)}

      <h3 className="entity-sidebar__heading">Need help?</h3>
      <p className="entity-sidebar__help-text">
        {`Do you need help to upgrade or downgrade?
        Don't hesitate to talk to our customer success team.`}
      </p>
      <p>
        <ContactUsButton />
      </p>
    </div>
  );
};

SpaceUsageSidebar.propTypes = {
  spaceResources: PropTypes.object,
  envResources: PropTypes.object,
  environmentId: PropTypes.string
};

SpaceUsageSidebar.defaultProps = {
  resources: {}
};

export default SpaceUsageSidebar;
