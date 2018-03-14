import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';

import * as Intercom from 'intercom';
import {byName as colors} from 'Styles/Colors';
import {highlightedResources, resourcesByPriority} from './SpaceUsageConfig';

import Icon from 'ui/Components/Icon';
import {resourceMaximumLimitReached} from 'utils/ResourceUtils';
import {supportUrl} from 'Config';

const getLimitsReachedResources = (resources) => {
  return resources
    .filter(resourceMaximumLimitReached)
    .map(resource => {
      return [...highlightedResources, ...resourcesByPriority]
        .find(item => item.id === resource.sys.id)
        .name;
    });
};

const SpaceUsageSidebar = createReactClass({
  propTypes: {
    resources: PropTypes.arrayOf(PropTypes.object)
  },

  handleCtaClick () {
    // Open intercom if it's possible, otherwise go to support page.
    if (Intercom.isEnabled()) {
      Intercom.open();
    } else {
      window.open(supportUrl);
    }
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
            onClick={this.handleCtaClick}
            className="text-link"
          >Get in touch with us</button>
        </p>
      </div>
    );
  }
});

export default SpaceUsageSidebar;
