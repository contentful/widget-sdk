import React, { useContext, useState, useEffect, useCallback, createRef } from 'react';
import { cx, css } from 'emotion';
import PropTypes from 'prop-types';

import { Button, Card, Flex, Grid, Heading, Tooltip } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { websiteUrl } from 'Config';
import ExternalTextLink from 'app/common/ExternalTextLink';

import { actions, SpacePurchaseState } from '../../context';
import { usePageContent } from '../../hooks/usePageContent.ts';
import { ProductCard } from '../../components/ProductCard';
import { SpacePlanCards } from '../../components/SpacePlanCards';
import { EnterpriseCard } from '../../components/EnterpriseCard';
import { CONTACT_SALES_HREF } from '../../components/EnterpriseTalkToUsButton';
import { FAQAccordion } from '../../components/FAQAccordion';
import { EVENTS } from '../../utils/analyticsTracking';
import { PLATFORM_CONTENT, PLATFORM_TYPES } from '../../utils/platformContent';
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
  stickyBar: css({
    // necessary css hack to position the bar sticky to the bottom without overlapping Worckbench’s scrollbar
    // and to fix some visible pixels from the rendered elements below the bar
    position: 'sticky',
    bottom: `-${tokens.spacingL}`,
    marginLeft: '-5%',
    width: '110%',
    backgroundColor: tokens.colorWhite,
    padding: `${tokens.spacingL} 0`,
    '& > div': {
      maxWidth: '1280px',
      margin: '0 auto',
    },
  }),
};

// TODO: this is a placeholder url, update with link to packages comparison
export const PACKAGES_COMPARISON_HREF = websiteUrl('pricing/#feature-overview');

export const PlatformSelectionStep = ({ onSubmit, track }) => {
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

  const [chooseSpaceLaterSelected, setChooseSpaceLaterSelected] = useState(false);

  const canCreateFreeSpace = canOrgCreateFreeSpace(freeSpaceResource);
  const canCreatePaidSpace = canUserCreatePaidSpace(organization);

  useEffect(() => {
    // we unselect any space plan when user changes platform
    if (selectedPlatform) {
      dispatch({ type: actions.SET_SELECTED_PLAN, payload: undefined });
      setChooseSpaceLaterSelected(false);
    }
  }, [dispatch, selectedPlatform]);

  const orgHasPaidSpaces = subscriptionPlans?.length > 0;
  const continueDisabled = !selectedPlatform || (!selectedPlan && !chooseSpaceLaterSelected);

  const scrollToSpaceSelection = useCallback(() => {
    spaceSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [spaceSectionRef]);

  const onSelect = (plan) => {
    track(EVENTS.SPACE_PLAN_SELECTED, {
      selectedPlan: plan,
    });

    dispatch({ type: actions.SET_SELECTED_PLAN, payload: plan });

    // select/unselect "Choose space later" card
    if (!plan) {
      setChooseSpaceLaterSelected(true);
    } else {
      setChooseSpaceLaterSelected(false);
    }
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
          // If they cannot create a paid space, then they cannot pay for compose+launch either.
          const tooltipText =
            platform.type === PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH && !canCreatePaidSpace
              ? `Please contact your organization owner and have them add billing information for your organization so you can purchase ${PLATFORM_CONTENT.composePlatform.title}`
              : '';

          return (
            <ProductCard
              key={idx}
              cardType="platform"
              selected={selectedPlatform?.title === platform.title}
              onClick={() => {
                dispatch({
                  type: actions.SET_SELECTED_PLATFORM,
                  payload: platform, // TODO: replace this with backend data
                });
                scrollToSpaceSelection();
              }}
              tooltipText={tooltipText}
              disabled={!!tooltipText}
              content={platform}
              isNew={platform.type === PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH}
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
          selectedPlatform={selectedPlatform?.title}
          selectedSpacePlanName={selectedPlan?.name}
          canCreateFreeSpace={canCreateFreeSpace}
          canCreatePaidSpace={canCreatePaidSpace}
          orgHasPaidSpaces={orgHasPaidSpaces}
          onSelect={onSelect}
          track={track}
        />

        {/* The option to "choose space later" should only be shown when an org has paid spaces and
      selects compose+launch, so they can buy compose+launch without having to buy a new space */}
        {orgHasPaidSpaces && selectedPlatform?.type === PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH && (
          <Flex className={styles.fullRow} flexDirection="row" marginTop="spacingL">
            <Card
              className={styles.chooseLaterCard}
              padding="large"
              testId="choose-space-later-button"
              selected={chooseSpaceLaterSelected}
              onClick={() => onSelect(undefined)}>
              <Heading element="p">Choose space later</Heading>
            </Card>
          </Flex>
        )}

        <div className={cx(styles.fullRow, styles.bigMarginTop)}>
          <FAQAccordion entries={faqEntries} track={track} />
        </div>
      </Grid>

      <div className={styles.stickyBar}>
        <Flex flexDirection="row" justifyContent="flex-end">
          <Tooltip
            place="top-end"
            content={continueDisabled ? 'Select organization package and space to continue' : ''}>
            <Button
              testId="platform-select-continue-button"
              disabled={continueDisabled}
              onClick={onSubmit}>
              Continue
            </Button>
          </Tooltip>
        </Flex>
      </div>
    </section>
  );
};
PlatformSelectionStep.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  track: PropTypes.func.isRequired,
};
