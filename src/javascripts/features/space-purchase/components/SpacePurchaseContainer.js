import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';

import { Grid, ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { Workbench } from '@contentful/forma-36-react-components';

import {
  createBillingDetails,
  setDefaultPaymentMethod,
  getDefaultPaymentMethod,
  getBillingDetails,
  getCountryCodeFromName,
} from 'features/organization-billing';
import { isFreeProductPlan } from 'account/pricing/PricingDataProvider';
import { isOwner as isOrgOwner } from 'services/OrganizationRoles';
import {
  Organization as OrganizationPropType,
  Space as SpacePropType,
} from 'app/OrganizationSettings/PropTypes';
import * as logger from 'services/logger';
import * as TokenStore from 'services/TokenStore';
import { EVENTS } from '../utils/analyticsTracking';
import { SPACE_PURCHASE_TYPES } from '../utils/spacePurchaseContent';
import { usePageContent } from '../hooks/usePageContent';
import { useTrackCancelEvent } from '../hooks/useTrackCancelEvent';
import { actions, SpacePurchaseState } from '../context';

import { Breadcrumbs } from 'features/breadcrumbs';
import { NewSpaceFAQ } from './NewSpaceFAQ';
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

const PLATFORM_AND_SPACE_STEPS = [
  { text: '1.Subscription', isActive: true },
  { text: '2.Payment', isActive: false },
  { text: '3.Confirmation', isActive: false },
];

const NEW_SPACE_STEPS = [
  { text: '1.Spaces', isActive: true },
  { text: '2.Payment', isActive: false },
  { text: '3.Confirmation', isActive: false },
];

const NEW_SPACE_STEPS_PAYMENT = [
  { text: '1.Spaces', isActive: false },
  { text: '2.Payment', isActive: true },
  { text: '3.Confirmation', isActive: false },
];

const NEW_SPACE_STEPS_CONFIRMATION = [
  { text: '1.Spaces', isActive: false },
  { text: '2.Payment', isActive: false },
  { text: '3.Confirmation', isActive: true },
];

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

// Fetch billing and payment information if organziation already has billing information
const fetchBillingDetails = async (
  organization,
  setPaymentDetails,
  setBillingDetails,
  setBillingDetailsLoading
) => {
  setBillingDetailsLoading(true);

  const [billingDetails, paymentMethod] = await Promise.all([
    getBillingDetails(organization.sys.id),
    getDefaultPaymentMethod(organization.sys.id),
  ]);

  setPaymentDetails(paymentMethod);
  setBillingDetails(billingDetails);
  setBillingDetailsLoading(false);
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
  hasPurchasedApps,
}) => {
  const { dispatch } = useContext(SpacePurchaseState);

  // if the user has already purchased apps, we want them to start at the space selection step
  // otherwise, they should start in the platfform and space selection step
  const initialStep = hasPurchasedApps ? STEPS.SPACE_SELECTION : STEPS.PLATFORM_SELECTION;

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [spaceName, setSpaceName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingDetails, setBillingDetails] = useState({});
  const [paymentDetails, setPaymentDetails] = useState({});
  const [billingDetailsLoading, setBillingDetailsLoading] = useState(false);

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
      fetchBillingDetails(
        organization,
        setPaymentDetails,
        setBillingDetails,
        setBillingDetailsLoading
      );
    }
  }, [userIsOrgOwner, organization]);

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

  const onSubmitPaymentMethod = async (refId) => {
    trackWithSession(EVENTS.PAYMENT_DETAILS_ENTERED);

    const newBillingDetails = {
      ...billingDetails,
      refid: refId,
    };

    let paymentMethod;
    try {
      await createBillingDetails(organization.sys.id, newBillingDetails);
      await setDefaultPaymentMethod(organization.sys.id, refId);
      [paymentMethod] = await Promise.all([
        getDefaultPaymentMethod(organization.sys.id),
        TokenStore.refresh(),
      ]);
    } catch (error) {
      trackWithSession(EVENTS.ERROR, {
        errorType: 'CreateAndSaveBillingDetails',
        error,
      });

      logger.logError('SpacePurchaseError', {
        data: {
          error,
          organizationId: organization.sys.id,
        },
      });

      throw error;
    }

    setPaymentDetails(paymentMethod);

    trackWithSession(EVENTS.PAYMENT_METHOD_CREATED);

    goToStep(STEPS.CONFIRMATION);
  };

  const getComponentForStep = (currentStep) => {
    switch (currentStep) {
      case STEPS.PLATFORM_SELECTION:
        return (
          <Grid columns={1} rows="repeat(3, 'auto')" rowGap="spacingXl">
            <Breadcrumbs items={PLATFORM_AND_SPACE_STEPS} />
            <PlatformSelectionStep track={trackWithSession} />
          </Grid>
        );
      case STEPS.SPACE_PLAN_SELECTION:
        return (
          <Grid columns={1} rows="repeat(3, 'auto')" rowGap="spacingM">
            <Breadcrumbs items={NEW_SPACE_STEPS} />
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
            />
            <NewSpaceFAQ faqEntries={faqEntries} trackWithSession={trackWithSession} />
          </Grid>
        );
      case STEPS.SPACE_DETAILS:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumbs items={NEW_SPACE_STEPS} />
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
          </Grid>
        );
      case STEPS.BILLING_DETAILS:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumbs items={NEW_SPACE_STEPS_PAYMENT} />
            <BillingDetailsStep
              onBack={() =>
                goToStep(currentSpace ? STEPS.SPACE_PLAN_SELECTION : STEPS.SPACE_DETAILS)
              }
              billingDetails={billingDetails}
              onSubmit={(newBillingDetails) => {
                trackWithSession(EVENTS.BILLING_DETAILS_ENTERED);

                setBillingDetails(newBillingDetails);
                goToStep(STEPS.CREDIT_CARD_DETAILS);
              }}
            />
          </Grid>
        );
      case STEPS.CREDIT_CARD_DETAILS:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumbs items={NEW_SPACE_STEPS_PAYMENT} />
            <CreditCardDetailsStep
              organizationId={organizationId}
              onBack={() => goToStep(STEPS.BILLING_DETAILS)}
              billingCountryCode={getCountryCodeFromName(billingDetails.country)}
              onSubmit={onSubmitPaymentMethod}
            />
          </Grid>
        );
      case STEPS.CONFIRMATION:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumbs items={NEW_SPACE_STEPS_PAYMENT} />
            <ConfirmationStep
              organizationId={organizationId}
              track={trackWithSession}
              showBillingDetails={userIsOrgOwner}
              showEditLink={organization.isBillable}
              billingDetailsLoading={billingDetailsLoading}
              billingDetails={billingDetails}
              paymentDetails={paymentDetails}
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
          </Grid>
        );
      case STEPS.RECEIPT:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumbs items={NEW_SPACE_STEPS_CONFIRMATION} />
            <SpaceCreationReceiptStep spaceName={spaceName} selectedTemplate={selectedTemplate} />
          </Grid>
        );
      case STEPS.UPGRADE_RECEIPT:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumbs items={NEW_SPACE_STEPS_CONFIRMATION} />
            <SpaceUpgradeReceiptStep />
          </Grid>
        );
    }
  };

  return (
    <Workbench>
      <Workbench.Header
        title="Space purchase"
        icon={<ProductIcon icon="Purchase" size="large" />}
      />
      <Workbench.Content>{getComponentForStep(currentStep)}</Workbench.Content>
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
  hasPurchasedApps: PropTypes.bool,
};
