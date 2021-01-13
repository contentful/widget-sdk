import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';

import { Grid, Workbench } from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';

import { isFreeProductPlan } from 'account/pricing/PricingDataProvider';
import { getDefaultPaymentMethod, getBillingDetails } from 'features/organization-billing';
import { isOwner as isOrgOwner } from 'services/OrganizationRoles';
import { EVENTS } from '../utils/analyticsTracking';
import { PLATFORM_TYPES } from '../utils/platformContent';
import { useTrackCancelEvent } from '../hooks/useTrackCancelEvent';
import { actions, SpacePurchaseState } from '../context';

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
} from '../steps';

const STEPS = {
  PLATFORM_SELECTION: 'PLATFORM_SELECTION',
  SPACE_PLAN_SELECTION: 'SPACE_PLAN_SELECTION',
  SPACE_DETAILS: 'SPACE_DETAILS',
  BILLING_DETAILS: 'BILLING_DETAILS',
  CREDIT_CARD_DETAILS: 'CREDIT_CARD_DETAILS',
  CONFIRMATION: 'CONFIRMATION',
  RECEIPT: 'RECEIPT',
  UPGRADE_RECEIPT: 'UPGRADE_RECEIPT',
};

const generateBreadcrumbItems = (step) => {
  const stepIsPlatform = step === STEPS.PLATFORM_SELECTION;

  const spaceSteps = [STEPS.PLATFORM_SELECTION, STEPS.SPACE_PLAN_SELECTION, STEPS.SPACE_DETAILS];

  const paymentSteps = [STEPS.BILLING_DETAILS, STEPS.CREDIT_CARD_DETAILS, STEPS.CONFIRMATION];

  const confirmationSteps = [STEPS.RECEIPT, STEPS.UPGRADE_RECEIPT];

  return [
    { text: stepIsPlatform ? '1.Subscription' : '1.Spaces', isActive: spaceSteps.includes(step) },
    { text: '2.Payment', isActive: paymentSteps.includes(step) },
    { text: '3.Confirmation', isActive: confirmationSteps.includes(step) },
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

export const SpacePurchaseContainer = ({ track }) => {
  const {
    state: { organization, selectedPlatform, selectedPlan, currentSpace, purchasingApps },
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

  const goToStep = (nextStep) => {
    track(EVENTS.NAVIGATE, {
      fromStep: STEPS[currentStep],
      toStep: STEPS[nextStep],
    });

    setCurrentStep(nextStep);
  };

  const getComponentForStep = (currentStep) => {
    switch (currentStep) {
      case STEPS.PLATFORM_SELECTION:
        return (
          <PlatformSelectionStep
            track={track}
            onSubmit={() => {
              if (selectedPlatform === PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH) {
                goToStep(organization.isBillable ? STEPS.CONFIRMATION : STEPS.BILLING_DETAILS);
              } else {
                goToStep(STEPS.SPACE_DETAILS);
              }
            }}
          />
        );
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
              if (selectedPlatform === PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH) {
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
              if (!organization.isBillable) {
                goToStep(STEPS.CREDIT_CARD_DETAILS);
              } else if (!currentSpace) {
                goToStep(
                  selectedPlatform === PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH
                    ? STEPS.PLATFORM_SELECTION
                    : STEPS.SPACE_DETAILS
                );
              } else {
                goToStep(STEPS.SPACE_PLAN_SELECTION);
              }
            }}
            onSubmit={() => {
              track(EVENTS.CONFIRM_PURCHASE);

              goToStep(currentSpace ? STEPS.UPGRADE_RECEIPT : STEPS.RECEIPT);
            }}
          />
        );
      case STEPS.RECEIPT:
        return <SpaceCreationReceiptStep />;
      case STEPS.UPGRADE_RECEIPT:
        return <SpaceUpgradeReceiptStep />;
    }
  };

  return (
    <Workbench>
      <Workbench.Header
        title="Space purchase"
        icon={<ProductIcon icon="Purchase" size="large" />}
      />
      <Workbench.Content>
        <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingXl">
          <Breadcrumbs items={generateBreadcrumbItems(currentStep)} />
          {getComponentForStep(currentStep)}
        </Grid>
      </Workbench.Content>
    </Workbench>
  );
};

SpacePurchaseContainer.propTypes = {
  track: PropTypes.func.isRequired,
};
