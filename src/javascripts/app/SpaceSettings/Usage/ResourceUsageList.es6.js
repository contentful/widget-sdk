import React from 'react';
import PropTypes from 'prop-types';
import EnvironmentIcon from 'svg/environment.es6';
import { Typography, Heading, Paragraph } from '@contentful/forma-36-react-components';
import { ResourceUsageHighlight, ResourceUsage } from './ResourceUsage.es6';

const ResourceUsageList = ({ spaceResources, envResources, environment }) =>
  spaceResources ? (
    <div className="resource-list">
      <section className="resource-list__highlights">
        <ResourceUsageHighlight resource={spaceResources['space_membership']} />
        <ResourceUsageHighlight resource={spaceResources['api_key']} />
        <ResourceUsageHighlight resource={spaceResources['webhook_definition']} />
      </section>
      <section>
        <ResourceUsage resource={spaceResources['role']} />
        <ResourceUsage resource={spaceResources['environment']} showMaximumLimit />
      </section>
      {envResources ? (
        <section>
          <Typography>
            <Heading>Environment Usage</Heading>
            <Paragraph>
              The following usage data is tracked on a per environment basis. Switch environments to
              view usage for other environments.
            </Paragraph>
            <Paragraph>
              Current environment: <EnvironmentIcon style={{ display: 'inline' }} /> {environment}
            </Paragraph>
          </Typography>
          <ResourceUsage resource={envResources['entry']} />
          <ResourceUsage resource={envResources['asset']} />
          <ResourceUsage resource={envResources['record']} description="Entries + Assets" />
          <ResourceUsage resource={envResources['content_type']} />
          <ResourceUsage resource={envResources['locale']} />
        </section>
      ) : null}
    </div>
  ) : null;

ResourceUsageList.propTypes = {
  spaceResources: PropTypes.object,
  envResources: PropTypes.object,
  environment: PropTypes.string
};

export default ResourceUsageList;
