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
import { Breadcrumb } from './Breadcrumb';
import { EVENTS } from '../utils/analyticsTracking';
import { NewSpaceBillingDetailsPage } from './NewSpaceBillingDetailsPage';
import { NewSpaceCardDetailsPage } from './NewSpaceCardDetailsPage';
import { NewSpaceConfirmationPage } from './NewSpaceConfirmationPage';
import { NewSpaceDetailsPage } from './NewSpaceDetailsPage';
import { NewSpaceFAQ } from './NewSpaceFAQ';
import { SPACE_PURCHASE_TYPES } from '../utils/spacePurchaseContent';
import { SpaceSelection } from './SpaceSelection';
import { NewSpaceReceiptPage } from './NewSpaceReceiptPage';
import { UpgradeSpaceReceiptPage } from './UpgradeSpaceReceiptPage';
import { usePageContent } from '../hooks/usePageContent';
import { useTrackCancelEvent } from '../hooks/useTrackCancelEvent';

import { actions, SpacePurchaseState } from '../context';

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

const SPACE_PURCHASE_STEPS = {
  SPACE_SELECTION: 'SPACE_SELECTION',
  SPACE_DETAILS: 'SPACE_DETAILS',
  BILLING_DETAILS: 'BILLING_DETAILS',
  CARD_DETAILS: 'CARD_DETAILS',
  CONFIRMATION: 'CONFIRMATION',
  RECEIPT: 'RECEIPT',
  UPGRADE_RECEIPT: 'UPGRADE_RECEIPT',
};

// Fetch billing and payment information if organziation already has billing information
const fetchBillingDetails = async (
  organization,
  setPaymentDetails,
  setBillingDetails,
  setIsLoadingBillingDetails
) => {
  setIsLoadingBillingDetails(true);
  const [billingDetails, paymentMethod] = await Promise.all([
    getBillingDetails(organization.sys.id),
    getDefaultPaymentMethod(organization.sys.id),
  ]);

  setPaymentDetails(paymentMethod);
  setBillingDetails(billingDetails);
  setIsLoadingBillingDetails(false);
};

export const NewSpacePage = ({
  organization,
  trackWithSession,
  templatesList,
  productRatePlans,
  canCreateCommunityPlan,
  pageContent,
  currentSpace,
  spaceRatePlans,
  currentSpacePlan,
  currentSpaceIsLegacy,
}) => {
  const { dispatch } = useContext(SpacePurchaseState);

  const [currentStep, setCurrentStep] = useState(SPACE_PURCHASE_STEPS.SPACE_SELECTION);
  const [spaceName, setSpaceName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingDetails, setBillingDetails] = useState({});
  const [paymentDetails, setPaymentDetails] = useState({});
  const [isLoadingBillingDetails, setIsLoadingBillingDetails] = useState(false);

  const organizationId = organization?.sys?.id;
  const hasBillingInformation = !!organization?.isBillable;
  const userIsOrgOwner = !!organization && isOrgOwner(organization);

  useTrackCancelEvent(trackWithSession, { currentStep, finalStep: SPACE_PURCHASE_STEPS.RECEIPT });

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
        setIsLoadingBillingDetails
      );
    }
  }, [userIsOrgOwner, organization]);

  // Space Purchase content
  const { faqEntries } = usePageContent(pageContent);
  const spaceIsFree = !!selectedPlan && isFreeProductPlan(selectedPlan);

  const onChangeSelectedTemplate = (changedTemplate) => {
    trackWithSession(EVENTS.SPACE_TEMPLATE_SELECTED, {
      selectedTemplate: changedTemplate?.name,
    });

    setSelectedTemplate(changedTemplate);
  };

  const onChangeSpaceName = (changedSpaceName) => {
    setSpaceName(changedSpaceName);
  };

  const goToStep = (nextStep) => {
    trackWithSession(EVENTS.NAVIGATE, {
      fromStep: SPACE_PURCHASE_STEPS[currentStep],
      toStep: SPACE_PURCHASE_STEPS[nextStep],
    });

    setCurrentStep(nextStep);
  };

  const selectPlan = (planType) => {
    if (!Object.values(SPACE_PURCHASE_TYPES).includes(planType)) {
      throw Error();
    }

    const selectedProductRatePlan = productRatePlans.find((productRatePlan) => {
      return productRatePlan.name.toLowerCase() === planType.toLowerCase();
    });

    trackWithSession(EVENTS.SPACE_PLAN_SELECTED, {
      selectedPlan: selectedProductRatePlan,
    });

    setSelectedPlan(selectedProductRatePlan);
    dispatch({ type: actions.SET_SELECTED_PLAN, payload: selectedProductRatePlan });

    // If there is a currentSpace and they have billingDetails they go straight to the confirmation page
    if (currentSpace && organization.isBillable) {
      goToStep(SPACE_PURCHASE_STEPS.CONFIRMATION);
    } else if (currentSpace && !organization.isBillable) {
      goToStep(SPACE_PURCHASE_STEPS.BILLING_DETAILS);
    } else {
      goToStep(SPACE_PURCHASE_STEPS.SPACE_DETAILS);
    }
  };

  const onSubmitSpaceDetails = () => {
    trackWithSession(EVENTS.SPACE_DETAILS_ENTERED);

    if (spaceIsFree) {
      // Since the space is free, they can immediately create the space (which happens on the receipt page)
      goToStep(SPACE_PURCHASE_STEPS.RECEIPT);
    } else if (organization.isBillable) {
      // Since they already have billing details, they can go straight to the confirmation page to confirm their purchase
      goToStep(SPACE_PURCHASE_STEPS.CONFIRMATION);
    } else {
      goToStep(SPACE_PURCHASE_STEPS.BILLING_DETAILS);
    }
  };

  const onBackConfirmation = () => {
    if (!organization.isBillable) {
      goToStep(SPACE_PURCHASE_STEPS.CARD_DETAILS);
    } else if (!currentSpace) {
      goToStep(SPACE_PURCHASE_STEPS.SPACE_DETAILS);
    } else {
      goToStep(SPACE_PURCHASE_STEPS.SPACE_SELECTION);
    }
  };

  const onSubmitBillingDetails = (billingDetails) => {
    trackWithSession(EVENTS.BILLING_DETAILS_ENTERED);

    setBillingDetails(billingDetails);
    goToStep(SPACE_PURCHASE_STEPS.CARD_DETAILS);
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

    goToStep(SPACE_PURCHASE_STEPS.CONFIRMATION);
  };

  const onConfirm = () => {
    trackWithSession(EVENTS.CONFIRM_PURCHASE);

    goToStep(currentSpace ? SPACE_PURCHASE_STEPS.UPGRADE_RECEIPT : SPACE_PURCHASE_STEPS.RECEIPT);
  };

  const getComponentForStep = (currentStep) => {
    switch (currentStep) {
      case SPACE_PURCHASE_STEPS.SPACE_DETAILS:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumb items={NEW_SPACE_STEPS} />
            <NewSpaceDetailsPage
              navigateToPreviousStep={() => goToStep(SPACE_PURCHASE_STEPS.SPACE_SELECTION)}
              spaceName={spaceName}
              onChangeSpaceName={onChangeSpaceName}
              templatesList={templatesList}
              onChangeSelectedTemplate={onChangeSelectedTemplate}
              selectedTemplate={selectedTemplate}
              onSubmit={onSubmitSpaceDetails}
              spaceIsFree={spaceIsFree}
            />
          </Grid>
        );
      case SPACE_PURCHASE_STEPS.BILLING_DETAILS:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumb items={NEW_SPACE_STEPS_PAYMENT} />
            <NewSpaceBillingDetailsPage
              navigateToPreviousStep={() =>
                goToStep(
                  currentSpace
                    ? SPACE_PURCHASE_STEPS.SPACE_SELECTION
                    : SPACE_PURCHASE_STEPS.SPACE_DETAILS
                )
              }
              savedBillingDetails={billingDetails}
              onSubmitBillingDetails={onSubmitBillingDetails}
            />
          </Grid>
        );
      case SPACE_PURCHASE_STEPS.CARD_DETAILS:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumb items={NEW_SPACE_STEPS_PAYMENT} />
            <NewSpaceCardDetailsPage
              organizationId={organizationId}
              navigateToPreviousStep={() => goToStep(SPACE_PURCHASE_STEPS.BILLING_DETAILS)}
              billingCountryCode={getCountryCodeFromName(billingDetails.country)}
              onSuccess={onSubmitPaymentMethod}
            />
          </Grid>
        );
      case SPACE_PURCHASE_STEPS.CONFIRMATION:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumb items={NEW_SPACE_STEPS_PAYMENT} />
            <NewSpaceConfirmationPage
              organizationId={organizationId}
              trackWithSession={trackWithSession}
              showBillingDetails={userIsOrgOwner}
              showEditLink={organization.isBillable}
              isLoadingBillingDetails={isLoadingBillingDetails}
              billingDetails={billingDetails}
              paymentDetails={paymentDetails}
              navigateToPreviousStep={onBackConfirmation}
              onConfirm={onConfirm}
            />
          </Grid>
        );
      case SPACE_PURCHASE_STEPS.RECEIPT:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumb items={NEW_SPACE_STEPS_CONFIRMATION} />
            <NewSpaceReceiptPage spaceName={spaceName} selectedTemplate={selectedTemplate} />
          </Grid>
        );
      case SPACE_PURCHASE_STEPS.UPGRADE_RECEIPT:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumb items={NEW_SPACE_STEPS_CONFIRMATION} />
            <UpgradeSpaceReceiptPage />
          </Grid>
        );
      default:
        // Return step 1: SPACE_SELECTION
        return (
          <Grid columns={1} rows="repeat(3, 'auto')" rowGap="spacingM">
            <Breadcrumb items={NEW_SPACE_STEPS} />
            <SpaceSelection
              organizationId={organizationId}
              selectPlan={selectPlan}
              canCreateCommunityPlan={canCreateCommunityPlan}
              canCreatePaidSpace={canCreatePaidSpace}
              trackWithSession={trackWithSession}
              spaceRatePlans={spaceRatePlans}
              loading={!spaceRatePlans}
              currentSpacePlan={currentSpacePlan}
              currentSpaceIsLegacy={currentSpaceIsLegacy}
            />
            <NewSpaceFAQ faqEntries={faqEntries} trackWithSession={trackWithSession} />
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

NewSpacePage.propTypes = {
  trackWithSession: PropTypes.func.isRequired,
  spaceRatePlans: PropTypes.array,
  currentSpacePlan: PropTypes.object,
  organization: OrganizationPropType,
  templatesList: PropTypes.array,
  productRatePlans: PropTypes.array,
  canCreateCommunityPlan: PropTypes.bool,
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
  currentSpaceIsLegacy: PropTypes.bool,
};
