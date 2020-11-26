import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';

import { Grid, ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { Workbench } from '@contentful/forma-36-react-components';

import { getDefaultPaymentMethod, getBillingDetails } from 'features/organization-billing';
import { isFreeProductPlan } from 'account/pricing/PricingDataProvider';
import { isOwner as isOrgOwner } from 'services/OrganizationRoles';
import {
  Organization as OrganizationPropType,
  Space as SpacePropType,
} from 'app/OrganizationSettings/PropTypes';
import { EVENTS } from '../utils/analyticsTracking';
import { SPACE_PURCHASE_TYPES } from '../utils/spacePurchaseContent';
import { usePageContent } from '../hooks/usePageContent';
import { useTrackCancelEvent } from '../hooks/useTrackCancelEvent';
import { actions, SpacePurchaseState } from '../context';

import { Breadcrumbs } from 'features/breadcrumbs';
import {
  BillingDetailsStep,
  CreditCardDetailsStep,
  ConfirmationStep,
  SpaceDetailsStep,
  SpacePlanSelectionStep,
  SpaceCreationReceiptStep,
  SpaceUpgradeReceiptStep,
} from '../steps';

const STEPS = {
  SPACE_PLAN_SELECTION: 'SPACE_PLAN_SELECTION',
  SPACE_DETAILS: 'SPACE_DETAILS',
  BILLING_DETAILS: 'BILLING_DETAILS',
  CREDIT_CARD_DETAILS: 'CREDIT_CARD_DETAILS',
  CONFIRMATION: 'CONFIRMATION',
  RECEIPT: 'RECEIPT',
  UPGRADE_RECEIPT: 'UPGRADE_RECEIPT',
};

const generateBreadcrumbItems = (step) => {
  const spaceSteps = [STEPS.SPACE_PLAN_SELECTION, STEPS.SPACE_DETAILS];

  const paymentSteps = [STEPS.BILLING_DETAILS, STEPS.CREDIT_CARD_DETAILS, STEPS.CONFIRMATION];

  const confirmationSteps = [STEPS.RECEIPT, STEPS.UPGRADE_RECEIPT];

  return [
    { text: '1.Spaces', isActive: spaceSteps.includes(step) },
    { text: '2.Payment', isActive: paymentSteps.includes(step) },
    { text: '3.Confirmation', isActive: confirmationSteps.includes(step) },
  ];
};

// Fetch billing and payment information if organziation already has billing information
const fetchBillingDetails = async (organization, dispatch) => {
  dispatch({ type: actions.SET_BILLING_DETAILS_LOADING, payload: true });

  const [billingDetails, paymentDetails] = await Promise.all([
    getBillingDetails(organization.sys.id),
    getDefaultPaymentMethod(organization.sys.id),
  ]);

  dispatch({ type: actions.SET_PAYMENT_DETAILS, payload: paymentDetails });
  dispatch({ type: actions.SET_BILLING_DETAILS, payload: billingDetails });
  dispatch({ type: actions.SET_BILLING_DETAILS_LOADING, payload: false });
};

export const SpacePurchaseContainer = ({
  organization,
  trackWithSession,
  templatesList,
  canCreateFreeSpace,
  pageContent,
  currentSpace,
  spaceRatePlans,
  currentSpacePlan,
  currentSpacePlanIsLegacy,
}) => {
  const { dispatch } = useContext(SpacePurchaseState);

  const [currentStep, setCurrentStep] = useState(STEPS.SPACE_PLAN_SELECTION);
  const [spaceName, setSpaceName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const organizationId = organization?.sys?.id;
  const hasBillingInformation = !!organization?.isBillable;
  const userIsOrgOwner = !!organization && isOrgOwner(organization);

  useTrackCancelEvent(trackWithSession, { currentStep, finalStep: STEPS.RECEIPT });

  // This is explicitly undefined/true/false, not just true/false, so that `canCreatePaidSpace`
  // when passed to `<SpaceSelection />` doesn't render the "no payment details" note until we
  // truly know if the user can create a paid space, which requires the organization to have loaded.
  const canCreatePaidSpace = organization && (userIsOrgOwner || hasBillingInformation);

  useEffect(() => {
    if (userIsOrgOwner && organization?.isBillable) {
      fetchBillingDetails(organization, dispatch);
    }
  }, [userIsOrgOwner, organization, dispatch]);

  // Space Purchase content
  const { faqEntries } = usePageContent(pageContent);
  const spaceIsFree = !!selectedPlan && isFreeProductPlan(selectedPlan);

  const onSelectTemplate = (selectedTemplate) => {
    trackWithSession(EVENTS.SPACE_TEMPLATE_SELECTED, {
      selectedTemplate: selectedTemplate?.name,
    });

    setSelectedTemplate(selectedTemplate);
  };

  const onChangeSpaceName = (changedSpaceName) => {
    setSpaceName(changedSpaceName);
  };

  const goToStep = (nextStep) => {
    trackWithSession(EVENTS.NAVIGATE, {
      fromStep: STEPS[currentStep],
      toStep: STEPS[nextStep],
    });

    setCurrentStep(nextStep);
  };

  const onSelectPlan = (planType) => {
    if (!Object.values(SPACE_PURCHASE_TYPES).includes(planType)) {
      throw Error();
    }

    const selectedPlan = spaceRatePlans.find((plan) => {
      return plan.name.toLowerCase() === planType.toLowerCase();
    });

    trackWithSession(EVENTS.SPACE_PLAN_SELECTED, {
      selectedPlan,
    });

    setSelectedPlan(selectedPlan);
    dispatch({ type: actions.SET_SELECTED_PLAN, payload: selectedPlan });

    // If there is a currentSpace and they have billingDetails they go straight to the confirmation page
    if (currentSpace && organization.isBillable) {
      goToStep(STEPS.CONFIRMATION);
    } else if (currentSpace && !organization.isBillable) {
      goToStep(STEPS.BILLING_DETAILS);
    } else {
      goToStep(STEPS.SPACE_DETAILS);
    }
  };

  const onSubmitSpaceDetails = () => {
    trackWithSession(EVENTS.SPACE_DETAILS_ENTERED);

    if (spaceIsFree) {
      // Since the space is free, they can immediately create the space (which happens on the receipt page)
      goToStep(STEPS.RECEIPT);
    } else if (organization.isBillable) {
      // Since they already have billing details, they can go straight to the confirmation page to confirm their purchase
      goToStep(STEPS.CONFIRMATION);
    } else {
      goToStep(STEPS.BILLING_DETAILS);
    }
  };

  const getComponentForStep = (currentStep) => {
    switch (currentStep) {
      case STEPS.SPACE_PLAN_SELECTION:
        return (
          <SpacePlanSelectionStep
            organizationId={organizationId}
            onSelectPlan={onSelectPlan}
            canCreateFreeSpace={canCreateFreeSpace}
            canCreatePaidSpace={canCreatePaidSpace}
            track={trackWithSession}
            spaceRatePlans={spaceRatePlans}
            loading={!spaceRatePlans}
            currentSpacePlan={currentSpacePlan}
            currentSpacePlanIsLegacy={currentSpacePlanIsLegacy}
            faqEntries={faqEntries}
          />
        );
      case STEPS.SPACE_DETAILS:
        return (
          <SpaceDetailsStep
            onBack={() => goToStep(STEPS.SPACE_PLAN_SELECTION)}
            spaceName={spaceName}
            onChangeSpaceName={onChangeSpaceName}
            templatesList={templatesList}
            onSelectTemplate={onSelectTemplate}
            selectedTemplate={selectedTemplate}
            onSubmit={onSubmitSpaceDetails}
            spaceIsFree={spaceIsFree}
          />
        );
      case STEPS.BILLING_DETAILS:
        return (
          <BillingDetailsStep
            onBack={() => goToStep(currentSpace ? STEPS.SPACE_PLAN_SELECTION : STEPS.SPACE_DETAILS)}
            onSubmit={() => {
              trackWithSession(EVENTS.BILLING_DETAILS_ENTERED);

              goToStep(STEPS.CREDIT_CARD_DETAILS);
            }}
          />
        );
      case STEPS.CREDIT_CARD_DETAILS:
        return (
          <CreditCardDetailsStep
            organizationId={organizationId}
            onBack={() => goToStep(STEPS.BILLING_DETAILS)}
            track={trackWithSession}
            onSubmit={() => {
              trackWithSession(EVENTS.PAYMENT_METHOD_CREATED);

              goToStep(STEPS.CONFIRMATION);
            }}
          />
        );
      case STEPS.CONFIRMATION:
        return (
          <ConfirmationStep
            organizationId={organizationId}
            track={trackWithSession}
            showBillingDetails={userIsOrgOwner}
            showEditLink={organization.isBillable}
            onBack={() => {
              if (!organization.isBillable) {
                goToStep(STEPS.CREDIT_CARD_DETAILS);
              } else if (!currentSpace) {
                goToStep(STEPS.SPACE_DETAILS);
              } else {
                goToStep(STEPS.SPACE_PLAN_SELECTION);
              }
            }}
            onSubmit={() => {
              trackWithSession(EVENTS.CONFIRM_PURCHASE);

              goToStep(currentSpace ? STEPS.UPGRADE_RECEIPT : STEPS.RECEIPT);
            }}
          />
        );
      case STEPS.RECEIPT:
        return (
          <SpaceCreationReceiptStep spaceName={spaceName} selectedTemplate={selectedTemplate} />
        );
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
        <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
          <Breadcrumbs items={generateBreadcrumbItems(currentStep)} />
          {getComponentForStep(currentStep)}
        </Grid>
      </Workbench.Content>
    </Workbench>
  );
};

SpacePurchaseContainer.propTypes = {
  trackWithSession: PropTypes.func.isRequired,
  spaceRatePlans: PropTypes.array,
  currentSpacePlan: PropTypes.object,
  organization: OrganizationPropType,
  templatesList: PropTypes.array,
  canCreateFreeSpace: PropTypes.bool,
  pageContent: PropTypes.shape({
    pageName: PropTypes.string.isRequired,
    content: PropTypes.arrayOf(
      PropTypes.shape({
        sys: PropTypes.object,
        fields: PropTypes.object,
      })
    ).isRequired,
  }),
  currentSpace: SpacePropType,
  currentSpacePlanIsLegacy: PropTypes.bool,
};
