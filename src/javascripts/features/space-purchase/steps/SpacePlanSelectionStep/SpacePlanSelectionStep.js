import React, { useContext } from 'react';
import cn from 'classnames';
import { css } from 'emotion';
import PropTypes from 'prop-types';

import { Grid, Flex } from '@contentful/forma-36-react-components/dist/alpha';
import {
  Card,
  Heading,
  Paragraph,
  Button,
  Tooltip,
  Note,
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonBodyText,
  Icon,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { websiteUrl } from 'Config';
import ExternalTextLink from 'app/common/ExternalTextLink';
import { isOwner as isOrgOwner } from 'services/OrganizationRoles';
import { resourceIncludedLimitReached } from 'utils/ResourceUtils';
import { trackCTAClick, CTA_EVENTS } from 'analytics/trackCTA';
import { SpaceCard, SPACE_PURCHASE_CONTACT_SALES_HREF } from '../../components/SpaceCard';
import { EVENTS } from '../../utils/analyticsTracking';
import { SPACE_PURCHASE_CONTENT, SPACE_PURCHASE_TYPES } from '../../utils/spacePurchaseContent';
import { PinLabel } from '../../components/PinLabel';
import { actions, SpacePurchaseState } from '../../context';
import { FAQAccordion } from '../../components/FAQAccordion';
import { usePageContent } from '../../hooks/usePageContent';

const styles = {
  fullRow: css({
    gridColumn: '1 / 4',
  }),
  sectionHeading: css({
    marginBottom: tokens.spacingM,
    fontWeight: tokens.fontWeightMedium,
  }),
  normalWeight: css({
    fontWeight: tokens.fontWeightNormal,
  }),
  communitySection: css({
    display: 'flex',
    flexDirection: 'column',
    '& a': { margin: `${tokens.spacingM} auto 0` },
  }),
  communityCard: css({
    position: 'relative',
    padding: `${tokens.spacingXl} ${tokens.spacingL}`,
    '&:before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      backgroundColor: tokens.colorYellowMid,
      width: tokens.spacingXs,
      height: '100%',
    },
  }),
  helpIcon: css({
    // necessary to align icon with text
    marginBottom: '-4px',
  }),
  legacyResourcesList: css({
    display: 'flex',
    '& li': {
      margin: `${tokens.spacingXs} ${tokens.spacingM} 0 0`,
    },
  }),
};

// Exported for testing only
export const FEATURE_OVERVIEW_HREF = websiteUrl('pricing/#feature-overview');

export const SpacePlanSelectionStep = ({ onSubmit, track }) => {
  const {
    state: {
      organization,
      currentSpace,
      currentSpaceRatePlan,
      spaceRatePlans,
      freeSpaceResource,
      pageContent,
    },
    dispatch,
  } = useContext(SpacePurchaseState);
  const { faqEntries } = usePageContent(pageContent);

  const selectPlan = (plan) => {
    track(EVENTS.SPACE_PLAN_SELECTED, {
      selectedPlan: plan,
    });

    dispatch({ type: actions.SET_SELECTED_PLAN, payload: plan });

    onSubmit();
  };

  // We want these to be undefined/true/false, rather than simply true/false, so that we don't
  // show the relevant components until we have a boolean value.
  const canCreatePaidSpace =
    organization && (isOrgOwner(organization) || !!organization.isBillable);
  const canCreateFreeSpace = freeSpaceResource && !resourceIncludedLimitReached(freeSpaceResource);

  const isFreeSpaceDisabled =
    spaceRatePlans && spaceRatePlans.find((plan) => plan.price === 0)?.disabled;

  // If the plan is not in the product rate plans, it's legacy.
  const showLegacyPlanWarning =
    currentSpaceRatePlan &&
    !spaceRatePlans.find((plan) => plan.sys.id === currentSpaceRatePlan.productRatePlanId);

  return (
    <section aria-labelledby="space-selection-section" data-test-id="space-selection-section">
      <Grid columns={3} rows="repeat(3, 'auto')" columnGap="spacingL" rowGap="spacingM">
        {canCreatePaidSpace === false && (
          <Note
            testId="payment-details-required"
            className={styles.fullRow}
            title="Payment details required">
            There are no payment details added to your organization. Contact the organization owner
            to add payment details and start purchasing spaces.
          </Note>
        )}
        {spaceRatePlans && (
          <Heading
            id="space-selection-heading"
            element="h2"
            className={cn(styles.fullRow, styles.sectionHeading)}
            testId="space-selection.heading">
            {currentSpaceRatePlan
              ? 'Choose the space you’d like to change to'
              : 'Choose the space that’s right for your project'}
          </Heading>
        )}
        {!spaceRatePlans && (
          <SkeletonContainer
            svgHeight={47}
            className={styles.fullRow}
            testId="space-rate-plans-loading">
            <SkeletonDisplayText />
          </SkeletonContainer>
        )}

        {showLegacyPlanWarning && (
          <LegacySpaceWarning spaceName={currentSpace.name} spacePlan={currentSpaceRatePlan} />
        )}

        {SPACE_PURCHASE_CONTENT.map((spaceContent, idx) => {
          const plan =
            spaceRatePlans && spaceRatePlans.find((plan) => plan.name === spaceContent.type);
          const isCurrentPlan = currentSpaceRatePlan?.name === spaceContent.type;
          const isEnterprisePlan = spaceContent.type === SPACE_PURCHASE_TYPES.ENTERPRISE;

          return (
            <SpaceCard
              key={idx}
              loading={!spaceRatePlans}
              disabled={!canCreatePaidSpace || plan?.disabled}
              selected={isCurrentPlan}
              plan={plan}
              content={spaceContent}
              organizationId={organization?.sys.id}
              onSelect={() => {
                if (isEnterprisePlan) {
                  track(EVENTS.EXTERNAL_LINK_CLICKED, {
                    href: SPACE_PURCHASE_CONTACT_SALES_HREF,
                    intent: 'upgrade_to_enterprise',
                  });

                  // Do we want to track this as a CTA upgrade to enterprise click as well?
                  trackCTAClick(CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
                    organizationId: organization.sys.id,
                  });
                } else {
                  selectPlan(plan);
                }
              }}
            />
          );
        })}

        <div className={cn(styles.fullRow, styles.communitySection)}>
          <Card className={styles.communityCard} testId="space-selection.community-card">
            {spaceRatePlans && (
              <Flex justifyContent="space-between" alignItems="center">
                <div>
                  <Heading element="h3" className={styles.normalWeight}>
                    Community
                  </Heading>
                  <Paragraph>Free space limited to 1 per organization.</Paragraph>
                </div>

                {currentSpaceRatePlan?.name === SPACE_PURCHASE_TYPES.COMMUNITY ? (
                  <PinLabel labelText="Current space" />
                ) : (
                  <Tooltip
                    testId="read-only-tooltip"
                    maxWidth={270}
                    place="auto"
                    content={getCommunityTooltipContent(canCreateFreeSpace, isFreeSpaceDisabled)}>
                    <Button
                      testId="space-selection-community-select-button"
                      onClick={() => {
                        const freeProductRatePlan = spaceRatePlans.find((plan) => plan.price === 0);

                        selectPlan(freeProductRatePlan);
                      }}
                      disabled={!canCreateFreeSpace || isFreeSpaceDisabled}>
                      Select
                    </Button>
                  </Tooltip>
                )}
              </Flex>
            )}
            {!spaceRatePlans && <CommunityLoadingState />}
          </Card>
          <ExternalTextLink
            testId="space-selection.feature-overview-link"
            href={FEATURE_OVERVIEW_HREF}
            onClick={() => {
              track(EVENTS.EXTERNAL_LINK_CLICKED, {
                href: FEATURE_OVERVIEW_HREF,
                intent: 'feature_overview',
              });
            }}>
            See full feature list
          </ExternalTextLink>
        </div>
        <div className={styles.fullRow}>
          <FAQAccordion entries={faqEntries} track={track} />
        </div>
      </Grid>
    </section>
  );
};

SpacePlanSelectionStep.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  track: PropTypes.func.isRequired,
};

function CommunityLoadingState() {
  return (
    <SkeletonContainer svgHeight={45} testId="free-space-loading">
      <SkeletonDisplayText width={120} />
      <SkeletonBodyText offsetTop={29} lineHeight={16} numberOfLines={1} width={240} />
    </SkeletonContainer>
  );
}

function getCommunityTooltipContent(canCreateFreeSpace, isFreeSpaceDisabled) {
  if (!canCreateFreeSpace) {
    return 'You’ve already used your free Community space. To add a new Community space, delete your existing one.';
  }

  if (isFreeSpaceDisabled) {
    return 'You are using more resources than this plan offers';
  }

  return '';
}

function LegacySpaceWarning({ spaceName, spacePlan }) {
  return (
    <Card className={styles.fullRow} testId="legacy-space-plan-warning">
      <b>
        {spaceName} is currently a {spacePlan.name} space
      </b>{' '}
      <Tooltip
        content="We no longer sell these spaces, for more information see our FAQ"
        maxWidth="200px">
        <Icon icon="HelpCircleTrimmed" color="muted" className={styles.helpIcon} />
      </Tooltip>
      {/* eslint-disable-next-line */}
      <ul className={styles.legacyResourcesList}>
        {spacePlan.ratePlanCharges.map((charge, idx) => {
          if (!charge.tiers) return null;
          return (
            <li key={idx}>
              {charge.tiers[0].endingUnit} {charge.name}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
LegacySpaceWarning.propTypes = {
  spaceName: PropTypes.string,
  spacePlan: PropTypes.object,
};