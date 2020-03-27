/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { pickBy, has } from 'lodash';
import ContactUsButton from 'ui/Components/ContactUsButton';
import { CodeFragment } from 'ui/Content';
import { resourceMaximumLimitReached, resourceHumanNameMap } from 'utils/ResourceUtils';
import { Note } from '@contentful/forma-36-react-components';

// Return a list with the names of the resources that reached the limit
const getLimitsReachedResources = (resources) => {
  return Object.values(resources)
    .filter(resourceMaximumLimitReached)
    .map((resource) => resourceHumanNameMap[resource.sys.id]);
};

const SpaceUsageSidebar = ({ spaceResources, environmentResources, environmentId }) => {
  const spaceOnlyResources = pickBy(spaceResources, (_, key) => !has(environmentResources, key));
  const limitsReachedSpaceResources = getLimitsReachedResources(spaceOnlyResources);
  const limitsReachedEnvResources = getLimitsReachedResources(environmentResources);

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
      <LimitsReachedMessage
        spaceResources={limitsReachedSpaceResources}
        environmentResources={limitsReachedEnvResources}
        environmentId={environmentId}
      />
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
  environmentResources: PropTypes.object,
  environmentId: PropTypes.string,
};

SpaceUsageSidebar.defaultProps = {
  spaceResources: {},
  environmentResources: {},
};

export default SpaceUsageSidebar;

function LimitsReachedMessage({ spaceResources, environmentResources, environmentId }) {
  const result = [];
  const envCodeFragment = (
    <CodeFragment style={{ display: 'inline' }}>{environmentId}</CodeFragment>
  );
  // create space message and concatenate environment message if necessary
  if (spaceResources.length > 0) {
    result.push(
      <Fragment key="space-limit-msg">
        You have reached the space limit for
        {spaceResources.length > 2
          ? ' a few of your space resources'
          : ` ${spaceResources.join(' and ')}`}
        {environmentResources.length > 0 ? (
          <Fragment>
            {' and other limits in your '}
            {envCodeFragment}
            {' environment. '}
          </Fragment>
        ) : (
          '.'
        )}
      </Fragment>
    );
    // if no space resources are at limit, just create environment limit message
  } else if (environmentResources.length > 0) {
    result.push(
      <Fragment key="env-limit-msg">
        You have reached the limit for
        {environmentResources.length > 2
          ? ` a few resources `
          : ` ${environmentResources.join(' and ')} `}
        in your {envCodeFragment} {'environment. '}
      </Fragment>
    );
  }
  // only add upgrade message if there are any other messages
  if (result.length > 0) {
    result.push(<Fragment key="upgrade-msg"> Consider upgrading your space plan.</Fragment>);
  }
  return result.length > 0 ? <Note>{result}</Note> : null;
}

LimitsReachedMessage.propTypes = {
  environmentResources: PropTypes.array,
  spaceResources: PropTypes.array,
  environmentId: PropTypes.string,
};
