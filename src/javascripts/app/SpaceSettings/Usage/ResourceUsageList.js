import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { CodeFragment } from 'ui/Content';
import { Typography, Heading, Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { ResourceUsageHighlight, ResourceUsage } from './ResourceUsage';
import EnvOrAliasLabel from 'app/common/EnvOrAliasLabel';

const styles = {
  environmentUsageParent: css({
    marginTop: tokens.spacing2Xl,
  }),
  environmentLabelParent: css({
    display: 'flex',
  }),
  environmentLabel: css({
    marginLeft: tokens.spacingS,
  }),
};

const ResourceUsageList = ({ spaceResources, environmentResources, environmentMeta }) => {
  if (!spaceResources) return null;

  const { environmentId, aliasId, isMasterEnvironment } = environmentMeta;

  return (
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
      {environmentResources && (
        <section className={styles.environmentUsageParent}>
          <Typography>
            <Heading>Environment Usage</Heading>
            <Paragraph>
              The following usage data is tracked on a per environment basis. Switch environments to
              view usage for other environments.
            </Paragraph>
            <Paragraph>
              <span className={styles.environmentLabelParent}>
                <span className={'f36-font-weight--medium'}>{'Current environment: '}</span>
                <span className={styles.environmentLabel}>
                  <CodeFragment>
                    <EnvOrAliasLabel
                      aliasId={aliasId}
                      environmentId={environmentId}
                      isMaster={isMasterEnvironment}
                      isSelected
                    />
                  </CodeFragment>
                </span>
              </span>
            </Paragraph>
          </Typography>
          <ResourceUsage resource={environmentResources['entry']} />
          <ResourceUsage resource={environmentResources['asset']} />
          <ResourceUsage resource={environmentResources['record']} description="Entries + Assets" />
          <ResourceUsage resource={environmentResources['content_type']} />
          <ResourceUsage resource={environmentResources['locale']} />
        </section>
      )}
    </div>
  );
};

ResourceUsageList.propTypes = {
  spaceResources: PropTypes.object,
  environmentResources: PropTypes.object,
  environmentMeta: PropTypes.shape({
    aliasId: PropTypes.string,
    environmentId: PropTypes.string.isRequired,
    isMasterEnvironment: PropTypes.bool.isRequired,
  }).isRequired,
};

export default ResourceUsageList;
