import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { CodeFragment } from 'ui/Content';
import { Typography, Heading, Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { ResourceUsageHighlight, ResourceUsage } from './ResourceUsage';
import EnvOrAliasLabel from 'app/common/EnvOrAliasLabel';
import * as ResourceUtils from 'utils/ResourceUtils';
import { getEntitlementByResourceKey } from './services/EntitlementService';

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

const ResourceUsageList = ({
  spaceResources,
  environmentResources,
  environmentMeta,
  entitlementsSet,
}) => {
  if (!spaceResources) {
    return null;
  }

  const { environmentId, aliasId, isMasterEnvironment } = environmentMeta;
  const getEntitlementFromResources = (entitlement) =>
    ResourceUtils.getResourceLimits(spaceResources[entitlement]).maximum;
  const getEntitlementFromNewAPI = (entitlement) =>
    getEntitlementByResourceKey(entitlement, entitlementsSet);

  const getEntitlement = (entitlement) =>
    entitlementsSet
      ? getEntitlementFromNewAPI(entitlement)
      : getEntitlementFromResources(entitlement);

  return (
    <div className="resource-list" data-test-id="resource-list">
      <section className="resource-list__highlights">
        <ResourceUsageHighlight resource={spaceResources['space_membership']} />
        <ResourceUsageHighlight resource={spaceResources['api_key']} />
        <ResourceUsageHighlight resource={spaceResources['webhook_definition']} />
      </section>
      <section>
        <ResourceUsage
          entitlement={getEntitlement('role')}
          usage={spaceResources['role'].usage}
          name={spaceResources['role'].name}
        />
        <ResourceUsage
          entitlement={getEntitlement('environment')}
          usage={spaceResources['environment'].usage}
          name={spaceResources['environment'].name}
        />
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
          <ResourceUsage
            name={spaceResources['entry'].name}
            entitlement={getEntitlement('entry')}
            usage={environmentResources['entry'].usage}
          />
          <ResourceUsage
            name={spaceResources['asset'].name}
            entitlement={getEntitlement('asset')}
            usage={environmentResources['asset'].usage}
          />
          <ResourceUsage
            name={spaceResources['record'].name}
            entitlement={getEntitlement('record')}
            usage={environmentResources['record'].usage}
            description="Entries + Assets"
          />
          <ResourceUsage
            name={spaceResources['content_type'].name}
            entitlement={getEntitlement('content_type')}
            usage={environmentResources['content_type'].usage}
          />
          <ResourceUsage
            name={spaceResources['locale'].name}
            entitlement={getEntitlement('locale')}
            usage={environmentResources['locale'].usage}
          />
        </section>
      )}
    </div>
  );
};

ResourceUsageList.propTypes = {
  spaceResources: PropTypes.object,
  environmentResources: PropTypes.object,
  entitlementsSet: PropTypes.object,
  environmentMeta: PropTypes.shape({
    aliasId: PropTypes.string,
    environmentId: PropTypes.string.isRequired,
    isMasterEnvironment: PropTypes.bool.isRequired,
  }).isRequired,
};

export default ResourceUsageList;
