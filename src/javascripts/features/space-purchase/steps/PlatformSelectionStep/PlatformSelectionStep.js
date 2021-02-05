import React, { useContext, useEffect, useCallback, createRef } from 'react';
import { cx, css } from 'emotion';
import PropTypes from 'prop-types';

import { Card, Flex, Grid, Heading } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { websiteUrl } from 'Config';
import ExternalTextLink from 'app/common/ExternalTextLink';

import { actions, SpacePurchaseState, NONE } from '../../context';
import { usePageContent } from '../../hooks/usePageContent.ts';
import { ProductCard } from '../../components/ProductCard';
import { SpacePlanCards } from '../../components/SpacePlanCards';
import { EnterpriseCard } from '../../components/EnterpriseCard';
import { CONTACT_SALES_HREF } from '../../components/EnterpriseTalkToUsButton';
import { FAQAccordion } from '../../components/FAQAccordion';
import { EVENTS } from '../../utils/analyticsTracking';
import { PLATFORM_CONTENT, PlatformKind } from '../../utils/platformContent';
import { canUserCreatePaidSpace, canOrgCreateFreeSpace } from '../../utils/canCreateSpace';

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
  chooseLaterCard: css({
    width: '100%',
    opacity: 1,
    transition: 'opacity 0.2s ease-in-out',
    '& p': { fontWeight: tokens.fontWeightMedium },
  }),
};

// TODO: this is a placeholder url, update with link to packages comparison
export const PACKAGES_COMPARISON_HREF = websiteUrl('pricing/#feature-overview');

export const PlatformSelectionStep = ({ track }) => {
  const {
    state: {
      organization,
      pageContent,
      spaceRatePlans,
      subscriptionPlans,
      selectedPlatform,
      selectedPlan,
      freeSpaceResource,
    },
    dispatch,
  } = useContext(SpacePurchaseState);
  const { faqEntries } = usePageContent(pageContent);

  const spaceSectionRef = createRef();

  const canCreateFreeSpace = canOrgCreateFreeSpace(freeSpaceResource);
  const canCreatePaidSpace = canUserCreatePaidSpace(organization);

  useEffect(() => {
    // we unselect any space plan when user changes platform
    if (selectedPlatform) {
      dispatch({ type: actions.SET_SELECTED_PLAN, payload: undefined });
    }
  }, [dispatch, selectedPlatform]);

  const orgHasPaidSpaces = subscriptionPlans?.length > 0;

  const scrollToSpaceSelection = useCallback(() => {
    spaceSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [spaceSectionRef]);

  const onSelectSpace = (plan) => {
    track(EVENTS.SPACE_PLAN_SELECTED, {
      selectedPlan: plan,
    });

    dispatch({ type: actions.SET_SELECTED_PLAN, payload: plan });
  };

  const onSelectPlatform = (platform) => {
    track(EVENTS.PLATFORM_SELECTED, {
      selectedPlatform: platform,
    });

    dispatch({
      type: actions.SET_SELECTED_PLATFORM,
      payload: platform, // TODO: replace this with backend data
    });
    scrollToSpaceSelection();
  };

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

        {Object.values(PLATFORM_CONTENT).map((platform, idx) => {
          let tooltipText = '';
          // If they cannot create a paid space, then they cannot pay for compose+launch either. Check for false as it's undefined while the page is loading.
          if (platform.type === PlatformKind.SPACE_COMPOSE_LAUNCH && canCreatePaidSpace === false) {
            tooltipText = `Please contact your organization owner and have them add billing information for your organization so you can purchase ${PLATFORM_CONTENT.composePlatform.title}`;
          }

          return (
            <ProductCard
              key={idx}
              cardType="platform"
              selected={selectedPlatform?.title === platform.title}
              onClick={() => onSelectPlatform(platform)}
              tooltipText={tooltipText}
              disabled={!!tooltipText}
              content={platform}
              isNew={platform.type === PlatformKind.SPACE_COMPOSE_LAUNCH}
              testId="platform-card"
            />
          );
        })}

        <EnterpriseCard
          organizationId={organization?.sys.id}
          handleSelect={() =>
            track(EVENTS.EXTERNAL_LINK_CLICKED, {
              href: CONTACT_SALES_HREF,
              intent: 'upgrade_to_enterprise',
            })
          }
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
          selectedSpacePlanName={selectedPlan?.name}
          canCreateFreeSpace={canCreateFreeSpace}
          canCreatePaidSpace={canCreatePaidSpace}
          orgHasPaidSpaces={orgHasPaidSpaces}
          onSelect={onSelectSpace}
          track={track}
        />

        {/* The option to "choose space later" should only be shown when an org has paid spaces and
      selects compose+launch, so they can buy compose+launch without having to buy a new space */}
        {orgHasPaidSpaces && selectedPlatform?.type === PlatformKind.SPACE_COMPOSE_LAUNCH && (
          <Flex className={styles.fullRow} flexDirection="row" marginTop="spacingL">
            <Card
              className={styles.chooseLaterCard}
              padding="large"
              testId="choose-space-later-button"
              selected={selectedPlan === NONE}
              onClick={() => {
                onSelectSpace(NONE);
              }}>
              <Heading element="p">Choose space later</Heading>
            </Card>
          </Flex>
        )}

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
