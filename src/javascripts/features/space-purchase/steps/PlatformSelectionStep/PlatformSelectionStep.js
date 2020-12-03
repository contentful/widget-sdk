import React, { useContext, useState } from 'react';
import { cx, css } from 'emotion';
import PropTypes from 'prop-types';

import { Grid, GridItem } from '@contentful/forma-36-react-components/dist/alpha';
import { Heading } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { websiteUrl } from 'Config';
import ExternalTextLink from 'app/common/ExternalTextLink';

import { SpacePurchaseState } from '../../context';
import { EVENTS } from '../../utils/analyticsTracking';
import { PLATFORM_CONTENT, PLATFORM_TYPES } from '../../utils/platformContent';
import { SPACE_PLANS_CONTENT, SPACE_PURCHASE_TYPES } from '../../utils/spacePurchaseContent';
import { ProductCard } from '../../components/ProductCard';
import { EnterpriseCard } from '../../components/EnterpriseCard';
import { CONTACT_SALES_HREF } from '../../components/EnterpriseTalkToUsButton';

const styles = {
  headingContainer: css({
    marginBottom: tokens.spacingL,
    opacity: 1,
    transition: 'opacity 0.2s ease-in-out',
  }),
  heading: css({
    marginBottom: tokens.spacingXs,
  }),
  mediumWeight: css({
    fontWeight: tokens.fontWeightMedium,
  }),
  bigMarginTop: css({
    marginTop: tokens.spacing4Xl,
  }),
  disabled: css({
    opacity: 0.3,
  }),
};

// TODO: this is a placeholder url, update with link to packages comparison
export const PACKAGES_COMPARISON_HREF = websiteUrl('pricing/#feature-overview');

export const PlatformSelectionStep = ({ track }) => {
  const {
    state: { organization, spaceRatePlans },
  } = useContext(SpacePurchaseState);

  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedSpacePlan, setSelectedSpacePlan] = useState('');

  return (
    <section aria-labelledby="platform-selection-section" data-test-id="platform-selection-section">
      <Grid columns={3} rows="repeat(4, 'auto')" columnGap="spacingL">
        <GridItem columnStart={1} columnEnd={4} className={styles.headingContainer}>
          <Heading
            id="platform-selection-heading"
            element="h2"
            className={cx(styles.mediumWeight, styles.heading)}>
            Choose the package that fits your organization needs
          </Heading>

          <ExternalTextLink
            testId="package-comparison-link"
            href={PACKAGES_COMPARISON_HREF}
            onClick={() => {
              track(EVENTS.EXTERNAL_LINK_CLICKED, {
                href: PACKAGES_COMPARISON_HREF,
                intent: 'packages_comparison',
              });
            }}>
            See comparison packages
          </ExternalTextLink>
        </GridItem>

        {PLATFORM_CONTENT.map((platform, idx) => {
          const content = {
            title: platform.title,
            description: platform.description,
            price: platform.price,
          };

          return (
            <ProductCard
              key={idx}
              cardType="platform"
              selected={selectedPlatform === platform.type}
              onClick={() => setSelectedPlatform(platform.type)}
              content={content}
              isNew={platform.type === PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH}
              testId="platform-card"
            />
          );
        })}

        <EnterpriseCard
          organizationId={organization?.sys.id}
          handleSelect={track(EVENTS.EXTERNAL_LINK_CLICKED, {
            href: CONTACT_SALES_HREF,
            intent: 'upgrade_to_enterprise',
          })}
        />

        <GridItem
          columnStart={1}
          columnEnd={4}
          className={cx(styles.headingContainer, styles.bigMarginTop, {
            [styles.disabled]: !selectedPlatform,
          })}>
          <Heading element="h2" className={cx(styles.mediumWeight, styles.heading)}>
            Choose the space size that right for your project
          </Heading>
        </GridItem>

        {SPACE_PLANS_CONTENT.filter(
          (content) => content.type !== SPACE_PURCHASE_TYPES.ENTERPRISE
        ).map((spacePlanContent, idx) => {
          const plan = spaceRatePlans
            ? spaceRatePlans.find((plan) => plan.name === spacePlanContent.type)
            : {};

          const content = {
            title: spacePlanContent.title,
            description: spacePlanContent.description,
            price: plan ? plan.price : 0,
            limits: spacePlanContent.limits, // TODO: we need to use plan.inlcudedResources somehow
          };

          return (
            <ProductCard
              key={idx}
              cardType="space"
              disabled={!selectedPlatform}
              selected={selectedSpacePlan === plan.name}
              onClick={() => setSelectedSpacePlan(plan.name)}
              content={content}
              testId="space-plan-card"
            />
          );
        })}
      </Grid>
    </section>
  );
};
PlatformSelectionStep.propTypes = {
  track: PropTypes.func.isRequired,
};
