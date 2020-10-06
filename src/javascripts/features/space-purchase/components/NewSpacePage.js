import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import { Grid, NavigationIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { Workbench } from '@contentful/forma-36-react-components';

import {
  createBillingDetails,
  setDefaultPaymentMethod,
  getDefaultPaymentMethod,
  getBillingDetails,
  getCountryCodeFromName,
} from 'features/organization-billing';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { FREE_SPACE_IDENTIFIER, transformSpaceRatePlans } from 'app/SpaceWizards/shared/utils';
import { isFreeProductPlan, getSpaceRatePlans } from 'account/pricing/PricingDataProvider';
import { isOwner as isOrgOwner } from 'services/OrganizationRoles';
import { Organization as OrganizationPropType } from 'app/OrganizationSettings/PropTypes';
import { useAsync } from 'core/hooks/useAsync';
import * as logger from 'services/logger';
import * as TokenStore from 'services/TokenStore';
import createResourceService from 'services/ResourceService';

import { Breadcrumb } from './Breadcrumb';
import { NewSpaceFAQ } from './NewSpaceFAQ';
import { SpaceSelection } from './SpaceSelection';
import { NewSpaceDetailsPage } from './NewSpaceDetailsPage';
import { NewSpaceBillingDetailsPage } from './NewSpaceBillingDetailsPage';
import { NewSpaceCardDetailsPage } from './NewSpaceCardDetailsPage';
import { NewSpaceConfirmationPage } from './NewSpaceConfirmationPage';
import { NewSpaceReceiptPage } from './NewSpaceReceiptPage';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';

import { SPACE_PURCHASE_TYPES } from '../utils/spacePurchaseContent';
import { usePageContent } from '../hooks/usePageContent';

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
};

// Fetch billing and payment information if organziation already has billing information
const fetchBillingDetails = async (
  organization,
  setPaymentMethodInfo,
  setBillingDetails,
  setIsLoadingBillingDetails
) => {
  if (organization.isBillable) {
    setIsLoadingBillingDetails(true);
    const [billingDetails, paymentMethod] = await Promise.all([
      getBillingDetails(organization.sys.id),
      getDefaultPaymentMethod(organization.sys.id),
    ]);

    setPaymentMethodInfo(paymentMethod);
    setBillingDetails(billingDetails);
    setIsLoadingBillingDetails(false);
  }
};

const fetchSpaceRatePlans = (organization) => async () => {
  const endpoint = createOrganizationEndpoint(organization.sys.id);
  const orgResources = createResourceService(organization.sys.id, 'organization');
  const [freeSpaceResource, rawSpaceRatePlans] = await Promise.all([
    orgResources.get(FREE_SPACE_IDENTIFIER),
    getSpaceRatePlans(endpoint),
  ]);
  const spaceRatePlans = transformSpaceRatePlans({
    organization,
    spaceRatePlans: rawSpaceRatePlans,
    freeSpaceResource,
  });

  return { spaceRatePlans };
};

export const NewSpacePage = ({
  organization,
  templatesList,
  productRatePlans,
  canCreateCommunityPlan,
  pageContent,
  sessionMetadata,
}) => {
  const [currentStep, setCurrentStep] = useState(SPACE_PURCHASE_STEPS.SPACE_SELECTION);
  const [spaceName, setSpaceName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingDetails, setBillingDetails] = useState({});
  const [paymentMethodInfo, setPaymentMethodInfo] = useState({});
  const [isLoadingBillingDetails, setIsLoadingBillingDetails] = useState(false);

  const hasBillingInformation = organization.isBillable;
  const canCreatePaidSpace = isOrgOwner(organization) || hasBillingInformation;

  const { isLoading, data } = useAsync(
    useCallback(fetchSpaceRatePlans(organization), [organization])
  );

  useEffect(() => {
    fetchBillingDetails(
      organization,
      setPaymentMethodInfo,
      setBillingDetails,
      setIsLoadingBillingDetails
    );
  }, [organization]);

  // Space Purchase content
  const { faqEntries } = usePageContent(pageContent);
  const spaceIsFree = !!selectedPlan && isFreeProductPlan(selectedPlan);

  const onChangeSelectedTemplate = (changedTemplate) => {
    trackEvent(EVENTS.SPACE_TEMPLATE_SELECTED, sessionMetadata, {
      selectedTemplate: changedTemplate,
    });

    setSelectedTemplate(changedTemplate);
  };

  const onChangeSpaceName = (changedSpaceName) => {
    setSpaceName(changedSpaceName);
  };

  const goToStep = (nextStep) => {
    trackEvent(EVENTS.NAVIGATE, sessionMetadata, {
      fromStep: SPACE_PURCHASE_STEPS[currentStep],
      toStep: SPACE_PURCHASE_STEPS[nextStep],
    });

    setCurrentStep(nextStep);
    // Save the step in the history's state to use when the browser's forward or back button is clicked
    window.history.pushState({ step: nextStep }, null);
  };

  const navigateToPreviousStep = () => {
    // We use window's history's back function so that the history state is also correctly updated.
    window.history.back();
  };

  const selectPlan = (planType) => {
    if (!Object.values(SPACE_PURCHASE_TYPES).includes(planType)) {
      throw Error();
    }

    const selectedProductRatePlan = productRatePlans.find((productRatePlan) => {
      return productRatePlan.name.toLowerCase() === planType.toLowerCase();
    });

    trackEvent(EVENTS.SPACE_PLAN_SELECTED, sessionMetadata, {
      selectedPlan: selectedProductRatePlan,
    });

    setSelectedPlan(selectedProductRatePlan);
    goToStep(SPACE_PURCHASE_STEPS.SPACE_DETAILS);
  };

  const onSubmitSpaceDetails = () => {
    trackEvent(EVENTS.SPACE_DETAILS_ENTERED, sessionMetadata);

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

  const onSubmitBillingDetails = (billingDetails) => {
    trackEvent(EVENTS.BILLING_DETAILS_ENTERED, sessionMetadata);

    setBillingDetails(billingDetails);
    goToStep(SPACE_PURCHASE_STEPS.CARD_DETAILS);
  };

  const onSubmitPaymentMethod = async (refId) => {
    trackEvent(EVENTS.PAYMENT_DETAILS_ENTERED, sessionMetadata);

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
      logger.logError('SpacePurchaseError', {
        data: {
          error,
          organizationId: organization.sys.id,
        },
      });

      throw error;
    }

    setPaymentMethodInfo(paymentMethod);

    trackEvent(EVENTS.PAYMENT_METHOD_CREATED, sessionMetadata);

    goToStep(SPACE_PURCHASE_STEPS.CONFIRMATION);
  };

  const onConfirm = () => {
    trackEvent(EVENTS.CONFIRM_PURCHASE, sessionMetadata);

    goToStep(SPACE_PURCHASE_STEPS.RECEIPT);
  };

  const browserNavigationHandler = useCallback((e) => {
    // If no state/step is set, it's the first step.
    setCurrentStep(e.state?.step ?? SPACE_PURCHASE_STEPS.SPACE_SELECTION);
  }, []);

  useEffect(() => {
    // Adds a listener for the back and forward browser button
    window.addEventListener('popstate', browserNavigationHandler);

    return () => {
      window.removeEventListener('popstate', browserNavigationHandler);
    };
  }, [browserNavigationHandler]);

  const getComponentForStep = (currentStep) => {
    switch (currentStep) {
      case SPACE_PURCHASE_STEPS.SPACE_DETAILS:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumb items={NEW_SPACE_STEPS} />
            <NewSpaceDetailsPage
              navigateToPreviousStep={navigateToPreviousStep}
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
              navigateToPreviousStep={navigateToPreviousStep}
              savedBillingDetails={billingDetails}
              onSubmitBillingDetails={onSubmitBillingDetails}
              selectedPlan={selectedPlan}
            />
          </Grid>
        );
      case SPACE_PURCHASE_STEPS.CARD_DETAILS:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumb items={NEW_SPACE_STEPS_PAYMENT} />
            <NewSpaceCardDetailsPage
              organizationId={organization.sys.id}
              navigateToPreviousStep={navigateToPreviousStep}
              billingCountryCode={getCountryCodeFromName(billingDetails.country)}
              onSuccess={onSubmitPaymentMethod}
              selectedPlan={selectedPlan}
              navigateToNextStep={() => goToStep(SPACE_PURCHASE_STEPS.CONFIRMATION)}
            />
          </Grid>
        );
      case SPACE_PURCHASE_STEPS.CONFIRMATION:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumb items={NEW_SPACE_STEPS_PAYMENT} />
            <NewSpaceConfirmationPage
              organizationId={organization.sys.id}
              navigateToPreviousStep={navigateToPreviousStep}
              billingDetails={billingDetails}
              paymentMethod={paymentMethodInfo}
              selectedPlan={selectedPlan}
              hasBillingInformation={hasBillingInformation}
              isLoadingBillingDetails={isLoadingBillingDetails}
              onConfirm={onConfirm}
            />
          </Grid>
        );
      case SPACE_PURCHASE_STEPS.RECEIPT:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumb items={NEW_SPACE_STEPS_CONFIRMATION} />
            <NewSpaceReceiptPage
              selectedPlan={selectedPlan}
              spaceName={spaceName}
              organizationId={organization.sys.id}
              sessionMetadata={sessionMetadata}
              selectedTemplate={selectedTemplate}
            />
          </Grid>
        );
      default:
        // Return step 1: SPACE_SELECTION
        return (
          <Grid columns={1} rows="repeat(3, 'auto')" rowGap="spacingM">
            <Breadcrumb items={NEW_SPACE_STEPS} />
            <SpaceSelection
              organizationId={organization.sys.id}
              selectPlan={selectPlan}
              canCreateCommunityPlan={canCreateCommunityPlan}
              canCreatePaidSpace={canCreatePaidSpace}
              spaceRatePlans={data?.spaceRatePlans}
              loading={isLoading}
            />
            <NewSpaceFAQ faqEntries={faqEntries} />
          </Grid>
        );
    }
  };

  return (
    <Workbench>
      <Workbench.Header
        title="Space purchase"
        icon={<NavigationIcon icon="Purchase" size="large" />}
      />
      <Workbench.Content>{getComponentForStep(currentStep)}</Workbench.Content>
    </Workbench>
  );
};

NewSpacePage.propTypes = {
  sessionMetadata: PropTypes.object.isRequired,
  organization: OrganizationPropType.isRequired,
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
};
