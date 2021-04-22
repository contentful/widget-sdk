import React, { useState, useEffect, useContext } from 'react';
import { css } from 'emotion';
import PropTypes from 'prop-types';

import {
  Grid,
  Workbench,
  Flex,
  Tooltip,
  Button,
  Heading,
} from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';

import { isFreeProductPlan } from 'account/pricing/PricingDataProvider';
import { getDefaultPaymentMethod, getBillingDetails } from 'features/organization-billing';
import { isOwner as isOrgOwner } from 'services/OrganizationRoles';
import { EVENTS } from '../utils/analyticsTracking';
import { PlatformKind } from '../utils/platformContent';
import { useTrackCancelEvent } from '../hooks/useTrackCancelEvent';
import { Price } from 'core/components/formatting';
import { actions, SpacePurchaseState, NO_SPACE_PLAN } from '../context';

import { Breadcrumbs } from 'features/breadcrumbs';
import {
  BillingDetailsStep,
  CreditCardDetailsStep,
  ConfirmationStep,
  PlatformSelectionStep,
  SpaceDetailsStep,
  SpacePlanSelectionStep,
  SpaceCreationReceiptStep,
  SpaceUpgradeReceiptStep,
  ComposeAndLaunchReceiptStep,
} from '../steps';

const styles = {
  workbenchContent: css({
    padding: `${tokens.spacingL} 0 0`,
  }),
  grid: css({
    maxWidth: '1280px',
    margin: '0 auto',
    paddingBottom: tokens.spacingL,
  }),
  stickyBar: css({
    position: 'sticky',
    bottom: 0,
    left: 0,
    backgroundColor: tokens.colorWhite,
    borderTop: `1px solid ${tokens.colorElementMid}`,
    '& > div': { maxWidth: '1280px' },
  }),
  monthlyCost: css({
    marginRight: tokens.spacingL,
  }),
};

const STEPS = {
  PLATFORM_SELECTION: 'PLATFORM_SELECTION',
  SPACE_PLAN_SELECTION: 'SPACE_PLAN_SELECTION',
  SPACE_DETAILS: 'SPACE_DETAILS',
  BILLING_DETAILS: 'BILLING_DETAILS',
  CREDIT_CARD_DETAILS: 'CREDIT_CARD_DETAILS',
  CONFIRMATION: 'CONFIRMATION',
  RECEIPT: 'RECEIPT',
  UPGRADE_RECEIPT: 'UPGRADE_RECEIPT',
  COMPOSE_RECEIPT: 'COMPOSE_RECEIPT',
};

const generateBreadcrumbItems = (step) => {
  const spaceSteps = [STEPS.PLATFORM_SELECTION, STEPS.SPACE_PLAN_SELECTION, STEPS.SPACE_DETAILS];

  const paymentSteps = [STEPS.BILLING_DETAILS, STEPS.CREDIT_CARD_DETAILS, STEPS.CONFIRMATION];

  const confirmationSteps = [STEPS.RECEIPT, STEPS.UPGRADE_RECEIPT, STEPS.COMPOSE_RECEIPT];

  return [
    { text: '1.Subscription', isActive: spaceSteps.includes(step) },
    { text: '2.Payment', isActive: paymentSteps.includes(step) },
    { text: '3.Done', isActive: confirmationSteps.includes(step) },
  ];
};

// Fetch billing and payment information if organziation already has billing information
const fetchBillingDetails = async (organization, dispatch) => {
  const [billingDetails, paymentDetails] = await Promise.all([
    getBillingDetails(organization.sys.id),
    getDefaultPaymentMethod(organization.sys.id),
  ]);

  dispatch({ type: actions.SET_PAYMENT_DETAILS, payload: paymentDetails });
  dispatch({ type: actions.SET_BILLING_DETAILS, payload: billingDetails });
};

export const SpacePurchaseContainer = ({
  track,
  preselectApps = false,
  purchasingApps = false,
}) => {
  const {
    state: { organization, selectedPlatform, selectedPlan, currentSpace },
    dispatch,
  } = useContext(SpacePurchaseState);
  // if the user has already purchased apps, we want them to start at the space selection step
  // otherwise, they should start in the platfform and space selection step
  const initialStep = purchasingApps ? STEPS.PLATFORM_SELECTION : STEPS.SPACE_PLAN_SELECTION;
  const [currentStep, setCurrentStep] = useState(initialStep);

  useTrackCancelEvent(track, { currentStep, finalStep: STEPS.RECEIPT });

  useEffect(() => {
    if (organization?.isBillable && isOrgOwner(organization)) {
      fetchBillingDetails(organization, dispatch);
    }
  }, [organization, dispatch]);

  const selectedComposeLaunch = selectedPlatform?.type === PlatformKind.WEB_APP_COMPOSE_LAUNCH;

  const goToStep = (nextStep) => {
    track(EVENTS.NAVIGATE, {
      fromStep: STEPS[currentStep],
      toStep: STEPS[nextStep],
    });

    setCurrentStep(nextStep);
  };

  const onContinue = () => {
    // We skip space details step if user selected C+L or they are changing a space’s plan
    if (selectedComposeLaunch || currentSpace) {
      goToStep(organization.isBillable ? STEPS.CONFIRMATION : STEPS.BILLING_DETAILS);
    } else {
      goToStep(STEPS.SPACE_DETAILS);
    }
  };

  let monthlyCost = 0;
  if (selectedPlatform?.price) {
    monthlyCost += selectedPlatform.price;
  }
  if (selectedPlan?.price) {
    monthlyCost += selectedPlan.price;
  }

  let continueBtnTooltip = '';

  if (!selectedPlatform || !selectedPlan) {
    continueBtnTooltip = 'Select an organization package and space to continue';
  } else if (selectedPlan === NO_SPACE_PLAN && !selectedComposeLaunch) {
    continueBtnTooltip = 'You haven’t selected any new items. Make a purchase to continue.';
  }

  const getComponentForStep = (currentStep) => {
    switch (currentStep) {
      case STEPS.PLATFORM_SELECTION:
        return <PlatformSelectionStep track={track} showPlatformsAboveSpaces={preselectApps} />;
      case STEPS.SPACE_PLAN_SELECTION:
        return (
          <SpacePlanSelectionStep
            onSubmit={() => {
              if (currentSpace && organization.isBillable) {
                goToStep(STEPS.CONFIRMATION);
              } else if (currentSpace && !organization.isBillable) {
                goToStep(STEPS.BILLING_DETAILS);
              } else {
                goToStep(STEPS.SPACE_DETAILS);
              }
            }}
            track={track}
          />
        );
      case STEPS.SPACE_DETAILS:
        return (
          <SpaceDetailsStep
            onBack={() => goToStep(initialStep)}
            track={track}
            onSubmit={() => {
              track(EVENTS.SPACE_DETAILS_ENTERED);

              if (isFreeProductPlan(selectedPlan)) {
                // Since the space is free, they can immediately create the space (which happens on the receipt page)
                goToStep(STEPS.RECEIPT);
              } else if (organization.isBillable) {
                // Since they already have billing details, they can go straight to the confirmation page to confirm their purchase
                goToStep(STEPS.CONFIRMATION);
              } else {
                goToStep(STEPS.BILLING_DETAILS);
              }
            }}
          />
        );
      case STEPS.BILLING_DETAILS:
        return (
          <BillingDetailsStep
            onBack={() => {
              if (selectedComposeLaunch) {
                goToStep(STEPS.PLATFORM_SELECTION);
              } else {
                goToStep(currentSpace ? STEPS.SPACE_PLAN_SELECTION : STEPS.SPACE_DETAILS);
              }
            }}
            onSubmit={() => {
              track(EVENTS.BILLING_DETAILS_ENTERED);

              goToStep(STEPS.CREDIT_CARD_DETAILS);
            }}
          />
        );
      case STEPS.CREDIT_CARD_DETAILS:
        return (
          <CreditCardDetailsStep
            onBack={() => goToStep(STEPS.BILLING_DETAILS)}
            track={track}
            onSubmit={() => {
              track(EVENTS.PAYMENT_METHOD_CREATED);

              goToStep(STEPS.CONFIRMATION);
            }}
          />
        );
      case STEPS.CONFIRMATION:
        return (
          <ConfirmationStep
            track={track}
            onBack={() => {
              if (organization.isBillable) {
                // user does not have C+L yet || user selected C+L
                if (selectedComposeLaunch) {
                  goToStep(STEPS.PLATFORM_SELECTION);
                } else {
                  // if user is changing a space plan send them back to selection step because there is no space to be renamed
                  goToStep(currentSpace ? STEPS.SPACE_PLAN_SELECTION : STEPS.SPACE_DETAILS);
                }
              } else {
                // organization has NO billing details
                goToStep(STEPS.CREDIT_CARD_DETAILS);
              }
            }}
            onSubmit={() => {
              track(EVENTS.CONFIRM_PURCHASE);

              if (currentSpace) {
                goToStep(STEPS.UPGRADE_RECEIPT);
              } else {
                if (selectedPlan === NO_SPACE_PLAN) {
                  goToStep(STEPS.COMPOSE_RECEIPT);
                } else {
                  goToStep(STEPS.RECEIPT);
                }
              }
            }}
          />
        );
      case STEPS.RECEIPT:
        return <SpaceCreationReceiptStep />;
      case STEPS.UPGRADE_RECEIPT:
        return <SpaceUpgradeReceiptStep />;
      case STEPS.COMPOSE_RECEIPT:
        return <ComposeAndLaunchReceiptStep />;
    }
  };

  return (
    <Workbench>
      <Workbench.Header
        title="Space purchase"
        icon={<ProductIcon icon="Purchase" size="large" />}
      />
      <Workbench.Content type="full" className={styles.workbenchContent}>
        <Grid className={styles.grid} columns={1} rows="repeat(2, 'auto')" rowGap="spacingXl">
          <Breadcrumbs items={generateBreadcrumbItems(currentStep)} />
          {getComponentForStep(currentStep)}
        </Grid>

        {currentStep === STEPS.PLATFORM_SELECTION && (
          <Flex
            flexDirection="column"
            alignItems="center"
            paddingTop="spacingL"
            paddingBottom="spacingL"
            fullWidth
            className={styles.stickyBar}>
            <Flex flexDirection="row" justifyContent="flex-end" alignItems="center" fullWidth>
              <Heading className={styles.monthlyCost}>
                Monthly {selectedPlan ? 'total: ' : 'subtotal: '}
                <Price value={monthlyCost} testId="monthly-total" />
              </Heading>
              <Tooltip place="top-end" content={continueBtnTooltip}>
                <Button
                  testId="platform-select-continue-button"
                  disabled={!!continueBtnTooltip}
                  onClick={onContinue}>
                  Continue
                </Button>
              </Tooltip>
            </Flex>
          </Flex>
        )}
      </Workbench.Content>
    </Workbench>
  );
};

SpacePurchaseContainer.propTypes = {
  /** It’s the function containing all the track info common to every event inside the Space Purchase flow */
  track: PropTypes.func.isRequired,
  /** When true, it renders the apps card preselected in PlatformSelectionStep */
  preselectApps: PropTypes.bool,
  /** When true, Space Purchase will present the user with the option to buy apps (first step will be PlatformSelectionStep) */
  purchasingApps: PropTypes.bool,
};
