import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import ContactUsButton from 'ui/Components/ContactUsButton';
import {resourceMaximumLimitReached, resourceHumanNameMap} from 'utils/ResourceUtils';

// Return a list with the names of the resources that reached the limit
const getLimitsReachedResources = (resources) => {
  return resources
    .filter(resourceMaximumLimitReached)
    .map(resource => resourceHumanNameMap[resource.sys.id]);
};

const SpaceUsageSidebar = createReactClass({
  propTypes: {
    resources: PropTypes.arrayOf(PropTypes.object)
  },

  render () {
    const limitsReachedResources = getLimitsReachedResources(this.props.resources);

    return (
      <div className="entity-sidebar">
        <p>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.contentful.com/developers/docs/technical-limits/"
          >Technical limits apply</a>
        </p>

        {limitsReachedResources.length > 0 &&
          <p className="note-box--info">
            You have reached the limit for
            {limitsReachedResources.length > 2
              ? ' a few of your space resources. '
              : ` ${limitsReachedResources.join(' and ')}. `
            }
            Consider upgrading your space plan.
          </p>
        }

        <h3 className="entity-sidebar__heading">Need help?</h3>
        <p className="entity-sidebar__help-text">
          {`Do you need help to upgrade or downgrade?
          Don't hesitate to talk to our customer success team.`}
        </p>
        <ContactUsButton />
      </div>
    );
  }
});

export default SpaceUsageSidebar;
