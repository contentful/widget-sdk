import React, { useContext, useState, useEffect, createRef } from 'react';
import { cx, css } from 'emotion';
import PropTypes from 'prop-types';

import { Grid } from '@contentful/forma-36-react-components/dist/alpha';
import { Heading } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { websiteUrl } from 'Config';
import ExternalTextLink from 'app/common/ExternalTextLink';
import { usePrevious } from 'core/hooks';

import { SpacePurchaseState } from 'features/space-purchase/context/index';
import { EVENTS } from 'features/space-purchase/utils/analyticsTracking';
import { PLATFORM_CONTENT, PLATFORM_TYPES } from 'features/space-purchase/utils/platformContent';
import { ProductCard } from 'features/space-purchase/components/ProductCard';
import { SpacePlanCards } from 'features/space-purchase/components/SpacePlanCards';
import { EnterpriseCard } from 'features/space-purchase/components/EnterpriseCard';
import { CONTACT_SALES_HREF } from 'features/space-purchase/components/EnterpriseTalkToUsButton';
import { FAQAccordion } from 'features/space-purchase/components/FAQAccordion';
import { usePageContent } from 'features/space-purchase/hooks/usePageContent.ts';

const styles = {
  fullRow: css({
    gridColumn: '1 / 4',
  }),
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
    state: { organization, spaceRatePlans, subscriptionPlans, pageContent },
  } = useContext(SpacePurchaseState);
  const { faqEntries } = usePageContent(pageContent);

  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedSpacePlan, setSelectedSpacePlan] = useState('');

  const prevSelectedPlatform = usePrevious(selectedPlatform);
  const spaceSectionRef = createRef();

  const orgHasPaidSpaces = subscriptionPlans?.length > 0;

  useEffect(() => {
    // we want to scroll the user to space selection only the first time they select a platform
    if (!prevSelectedPlatform && selectedPlatform) {
      spaceSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [prevSelectedPlatform, selectedPlatform, spaceSectionRef]);

  useEffect(() => {
    // we unselect any space plan when user changes platform
    setSelectedSpacePlan('');
  }, [selectedPlatform]);

  return (
    <section aria-labelledby="platform-selection-section" data-test-id="platform-selection-section">
      <Grid columns={3} rows="repeat(4, 'auto')" columnGap="spacingL">
        <span className={cx(styles.headingContainer, styles.fullRow)}>
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
        </span>

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

        <span
          ref={spaceSectionRef}
          className={cx(styles.headingContainer, styles.fullRow, styles.bigMarginTop, {
            [styles.disabled]: !selectedPlatform,
          })}>
          <Heading element="h2" className={cx(styles.mediumWeight, styles.heading)}>
            Choose the space size that right for your project
          </Heading>
        </span>

        <SpacePlanCards
          spaceRatePlans={spaceRatePlans}
          selectedPlatform={selectedPlatform}
          selectedSpacePlan={selectedSpacePlan}
          onSelect={setSelectedSpacePlan}
          orgHasPaidSpaces={orgHasPaidSpaces}
        />

        <div className={cx(styles.fullRow, styles.bigMarginTop)}>
          <FAQAccordion entries={faqEntries} track={track} />
        </div>
      </Grid>
    </section>
  );
};
PlatformSelectionStep.propTypes = {
  track: PropTypes.func.isRequired,
};
