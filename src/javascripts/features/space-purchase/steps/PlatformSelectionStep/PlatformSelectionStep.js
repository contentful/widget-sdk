import React, { useContext, useCallback, createRef } from 'react';
import { cx, css } from 'emotion';
import PropTypes from 'prop-types';

import {
  Card,
  Flex,
  Grid,
  Heading,
  Paragraph,
  Icon,
  Note,
  TextLink,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { websiteUrl } from 'Config';
import ExternalTextLink from 'app/common/ExternalTextLink';
import { isTrialSpacePlan } from 'account/pricing/PricingDataProvider';
import { useAppsTrial } from 'features/trials';

import { actions, SpacePurchaseState, NO_SPACE_PLAN } from '../../context';
import { usePageContent } from '../../hooks/usePageContent.ts';
import { PlatformCards } from '../../components/PlatformCards';
import { SpacePlanCards } from '../../components/SpacePlanCards';
import { FAQAccordion } from '../../components/FAQAccordion';
import { EVENTS } from '../../utils/analyticsTracking';
import { PlatformKind } from '../../utils/platformContent';
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
  }),
  trialSpacesWarning: css({
    '& > p': {
      color: tokens.colorYellowDark,
      marginLeft: tokens.spacingXs,
    },
  }),
  limitsNote: css({
    marginTop: `-${tokens.spacingM}`,
    marginBottom: tokens.spacingM,
  }),
};

export const PACKAGES_COMPARISON_HREF = websiteUrl('contentful-apps');

export const PlatformSelectionStep = ({ track, showPlatformsAboveSpaces }) => {
  const {
    state: {
      organization,
      pageContent,
      spaceRatePlans,
      subscriptionPlans,
      selectedPlatform,
      selectedPlan,
      freeSpaceResource,
      composeAndLaunchProductRatePlan,
      currentSpace,
      currentSpaceRatePlan,
    },
    dispatch,
  } = useContext(SpacePurchaseState);
  const { faqEntries } = usePageContent(pageContent);
  const { isAppsTrialActive } = useAppsTrial(organization?.sys.id);

  const platformSectionRef = createRef();
  const spaceSectionRef = createRef();

  const spacePlanIsTrial = currentSpaceRatePlan && isTrialSpacePlan(currentSpaceRatePlan);
  const canCreateFreeSpace = canOrgCreateFreeSpace(freeSpaceResource);
  const canCreatePaidSpace = canUserCreatePaidSpace(organization);
  const spaceCardsDisabled = showPlatformsAboveSpaces && !selectedPlatform;
  const platformCardsDisabled = !showPlatformsAboveSpaces && !selectedPlan;
  // V1 migration communication for team customers
  const isV1MigrationSucceeded = organization.sys?._v1Migration?.status === 'succeeded';
  const v1migrationDestination = organization.sys?._v1Migration?.destination;
  const showV1MigrationNote =
    isV1MigrationSucceeded &&
    v1migrationDestination === 'team' &&
    currentSpaceRatePlan?.legacyVersion === 'V1Migration';

  // Only check for unavailbity reasons if the user is changing a space
  const largestSpacePlanWithUnavailabityReasons =
    currentSpaceRatePlan &&
    spaceRatePlans
      .filter((plan) => plan.sys.id !== currentSpaceRatePlan.sys.id)
      .sort((a, b) => b.price - a.price)
      .find((plan) =>
        plan.unavailabilityReasons?.find(
          (reason) =>
            reason.type !== 'currentPlan' && reason.type !== 'freeSpacesMaximumLimitReached'
        )
      );

  const orgHasPaidSpaces = subscriptionPlans?.length > 0;
  /**
   * The option to "Use your existing spaces" shows when
   * the organization has paid spaces already
   */
  const canUseExistingSpace = orgHasPaidSpaces;

  const scrollToSpaceSelection = useCallback(() => {
    spaceSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [spaceSectionRef]);

  const scrollToPlatformSelection = useCallback(() => {
    platformSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [platformSectionRef]);

  const onSelectSpace = (plan) => {
    track(EVENTS.SPACE_PLAN_SELECTED, {
      selectedPlan: plan,
    });

    dispatch({ type: actions.SET_SELECTED_PLAN, payload: plan });

    // we only scroll the user to platform selection when user is changing a space plan
    if (!showPlatformsAboveSpaces) {
      scrollToPlatformSelection();
    }
  };

  const onSelectPlatform = (platform) => {
    track(EVENTS.PLATFORM_SELECTED, {
      selectedPlatform: platform,
    });

    dispatch({
      type: actions.SET_SELECTED_PLATFORM,
      payload: platform, // TODO: replace this with backend data
    });

    // we only scroll the user to space selection when user is creating a space plan
    if (showPlatformsAboveSpaces) {
      scrollToSpaceSelection();
    }
  };

  return (
    <section aria-labelledby="platform-selection-section" data-test-id="platform-selection-section">
      <Flex
        testId="platform-space-order"
        flexDirection={!showPlatformsAboveSpaces ? 'column-reverse' : 'column'}>
        <Grid columns={3} rows="repeat(4, 'auto')" columnGap="spacingL">
          <span
            data-test-id="platform-container-span"
            ref={platformSectionRef}
            className={cx(styles.headingContainer, styles.fullRow, {
              [styles.disabled]: platformCardsDisabled,
              [styles.bigMarginTop]: !showPlatformsAboveSpaces,
            })}>
            <Heading
              id="platform-selection-heading"
              element="h2"
              className={cx(styles.mediumWeight, styles.heading)}>
              {currentSpace ? 'Next, choose ' : 'Choose '}the package that fits your organization
              needs
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
              See comparison of packages
            </ExternalTextLink>
          </span>

          <PlatformCards
            disabled={platformCardsDisabled}
            organizationId={organization?.sys.id}
            composeAndLaunchProductRatePlan={composeAndLaunchProductRatePlan}
            canCreatePaidSpace={canCreatePaidSpace}
            selectedPlan={selectedPlan}
            selectedPlatform={selectedPlatform}
            onSelectPlatform={onSelectPlatform}
            track={track}
          />
        </Grid>

        <Grid columns={3} rows="repeat(4, 'auto')" columnGap="spacingL">
          <span
            ref={spaceSectionRef}
            data-test-id="space-container-span"
            className={cx(styles.headingContainer, styles.fullRow, {
              [styles.disabled]: spaceCardsDisabled,
              [styles.bigMarginTop]: showPlatformsAboveSpaces,
            })}>
            <Heading element="h2" className={cx(styles.mediumWeight, styles.heading)}>
              {currentSpace
                ? `Upgrade your ${spacePlanIsTrial ? 'trial' : ''} space to`
                : 'Choose the space size that’s right for your project'}
            </Heading>

            {showV1MigrationNote && (
              <Note
                className={styles.fullRow}
                title={
                  <div>
                    Your space <strong>{currentSpace.name}</strong> is assigned to a legacy
                    subscription plan, which includes custom pricing.
                  </div>
                }>
                If you modify this space, you will lose access to this custom price. Got questions?{' '}
                <TextLink
                  href="https://www.contentful.com/support/"
                  target="_blank"
                  rel="noopener noreferrer">
                  Contact us
                </TextLink>
              </Note>
            )}

            {orgHasPaidSpaces &&
              selectedPlatform?.type === PlatformKind.WEB_APP_COMPOSE_LAUNCH &&
              currentSpace && (
                <Paragraph>Choose the space size that’s right for your project</Paragraph>
              )}
            {!orgHasPaidSpaces && selectedPlatform?.type === PlatformKind.WEB_APP_COMPOSE_LAUNCH && (
              <>
                {!currentSpace && (
                  <Paragraph>Purchase a Medium or Large space to get Compose + Launch</Paragraph>
                )}
                {currentSpace && (
                  <Paragraph>
                    Choose the size that suits your project, you must upgrade your trial space to
                    enable Compose + Launch
                  </Paragraph>
                )}
              </>
            )}
          </span>

          {largestSpacePlanWithUnavailabityReasons && (
            <NoteOfUnavailityReasons
              largestSpacePlanWithUnavailabityReasons={largestSpacePlanWithUnavailabityReasons}
            />
          )}
          <SpacePlanCards
            spaceCardsDisabled={spaceCardsDisabled}
            spaceRatePlans={spaceRatePlans}
            selectedPlatform={selectedPlatform}
            spacePlanIsTrial={spacePlanIsTrial}
            selectedSpacePlanName={selectedPlan?.name}
            canCreateFreeSpace={canCreateFreeSpace}
            canCreatePaidSpace={canCreatePaidSpace}
            orgHasPaidSpaces={orgHasPaidSpaces}
            onSelect={onSelectSpace}
          />

          {canUseExistingSpace && (
            <Flex className={styles.fullRow} flexDirection="row" marginTop="spacingL">
              <Card
                className={styles.chooseLaterCard}
                padding="large"
                testId="choose-space-later-button"
                selected={selectedPlan === NO_SPACE_PLAN}
                onClick={() => {
                  onSelectSpace(NO_SPACE_PLAN);
                }}>
                <Heading element="p">Use your existing spaces</Heading>
                {isAppsTrialActive && (
                  <Flex className={styles.trialSpacesWarning} flexDirection="row">
                    <Icon color="warning" icon="Warning" />
                    <Paragraph>
                      The trial space will be converted read-only and you will no longer able to use
                      it
                    </Paragraph>
                  </Flex>
                )}
              </Card>
            </Flex>
          )}
        </Grid>
      </Flex>

      <Flex flexDirection="column" marginTop="spacing4Xl">
        <FAQAccordion entries={faqEntries} track={track} />
      </Flex>
    </section>
  );
};

PlatformSelectionStep.propTypes = {
  track: PropTypes.func.isRequired,
  showPlatformsAboveSpaces: PropTypes.bool,
};

const NoteOfUnavailityReasons = ({ largestSpacePlanWithUnavailabityReasons }) => {
  const limitExplanations = largestSpacePlanWithUnavailabityReasons.unavailabilityReasons.reduce(
    (explaintions, reason) => {
      switch (reason.type) {
        case 'maximumLimitExceeded':
          return [...explaintions, `You are using ${reason.usage} ${reason.additionalInfo}`];
        case 'roleIncompatibility':
          return [
            ...explaintions,
            `The role ${reason.additionalInfo} is not available in this space size`,
          ];
        default:
          return explaintions;
      }
    },
    []
  );

  return (
    <Note
      className={cx(styles.limitsNote, styles.fullRow)}
      title="You can't change to a smaller space because you are exceeding their limits.">
      {limitExplanations.join('. ')}.
    </Note>
  );
};

NoteOfUnavailityReasons.propTypes = {
  largestSpacePlanWithUnavailabityReasons: PropTypes.object.isRequired,
};
