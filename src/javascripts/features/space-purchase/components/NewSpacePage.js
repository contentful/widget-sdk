import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import { Grid, NavigationIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { Workbench } from '@contentful/forma-36-react-components';

import { isFreeProductPlan } from 'account/pricing/PricingDataProvider';
import {
  createBillingDetails,
  setDefaultPaymentMethod,
  getDefaultPaymentMethod,
} from 'features/organization-billing';
import * as logger from 'services/logger';

import { Breadcrumb } from './Breadcrumb';
import { NewSpaceFAQ } from './NewSpaceFAQ';
import { SpaceSelection } from './SpaceSelection';
import { NewSpaceDetailsPage } from './NewSpaceDetailsPage';
import { NewSpaceBillingDetailsPage } from './NewSpaceBillingDetailsPage';
import { NewSpaceCardDetailsPage } from './NewSpaceCardDetailsPage';
import { NewSpaceConfirmationPage } from './NewSpaceConfirmationPage';
import { NewSpaceReceiptPage } from './NewSpaceReceiptPage';

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

const spacePurchaseSteps = {
  SPACE_SELECTION: 0,
  SPACE_DETAILS: 1,
  BILLING_DETAILS: 2,
  CARD_DETAILS: 3,
  CONFIRMATION: 4,
  RECEIPT: 5,
};

export const NewSpacePage = ({
  organizationId,
  templatesList,
  productRatePlans,
  canCreateCommunityPlan,
  pageContent,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [spaceName, setSpaceName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingDetails, setBillingDetails] = useState({});
  const [paymentMethodInfo, setPaymentMethodInfo] = useState(null);

  // Space Purchase content
  const { faqEntries } = usePageContent(pageContent);

  const spaceIsFree = !!selectedPlan && isFreeProductPlan(selectedPlan);

  const onChangeSelectedTemplate = (changedTemplate) => {
    setSelectedTemplate(changedTemplate);
  };

  const onChangeSpaceName = (changedSpaceName) => {
    setSpaceName(changedSpaceName);
  };

  const goToStep = (nextStep) => {
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

    setSelectedPlan(selectedProductRatePlan);
    goToStep(spacePurchaseSteps.SPACE_DETAILS);
  };

  const onSubmitSpaceDetails = () => {
    // TODO: Add analytics here
    if (spaceIsFree) {
      goToStep(spacePurchaseSteps.RECEIPT);
    } else {
      goToStep(spacePurchaseSteps.BILLING_DETAILS);
    }
  };

  const onSubmitBillingDetails = (billingDetails) => {
    // Add analytics here

    setBillingDetails(billingDetails);
    goToStep(spacePurchaseSteps.CARD_DETAILS);
  };

  const onSubmitPaymentMethod = async (refId) => {
    const reconciledBillingDetails = {
      refid: refId,
      firstName: billingDetails.firstName,
      lastName: billingDetails.lastName,
      vat: billingDetails.vatNumber,
      workEmail: billingDetails.email,
      address1: billingDetails.address,
      address2: billingDetails.addressTwo,
      city: billingDetails.city,
      state: billingDetails.state,
      country: billingDetails.country,
      zipCode: billingDetails.postcode,
    };

    let paymentMethod;
    try {
      await createBillingDetails(organizationId, reconciledBillingDetails);
      await setDefaultPaymentMethod(organizationId, refId);
      paymentMethod = await getDefaultPaymentMethod(organizationId);
    } catch (error) {
      logger.logError('SpaceWizardError', {
        data: {
          error,
          organizationId,
          reconciledBillingDetails,
          refId,
        },
      });

      throw error;
    }

    setPaymentMethodInfo(paymentMethod);

    // TODO: Add analytics here

    goToStep(spacePurchaseSteps.CONFIRMATION);
  };

  const onConfirm = () => {
    // Add analytics here
    // Creating the zoura subscription goes here

    goToStep(spacePurchaseSteps.RECEIPT);
  };

  const browserNavigationHandler = useCallback((e) => {
    // If no state/step is set, it's the first step.
    setCurrentStep(e.state?.step ?? spacePurchaseSteps.SPACE_SELECTION);
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
      case spacePurchaseSteps.SPACE_DETAILS:
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
      case spacePurchaseSteps.BILLING_DETAILS:
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
      case spacePurchaseSteps.CARD_DETAILS:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumb items={NEW_SPACE_STEPS_PAYMENT} />
            <NewSpaceCardDetailsPage
              organizationId={organizationId}
              navigateToPreviousStep={navigateToPreviousStep}
              billingCountryCode={billingDetails.country}
              onSuccess={onSubmitPaymentMethod}
              selectedPlan={selectedPlan}
              navigateToNextStep={() => goToStep(spacePurchaseSteps.CONFIRMATION)}
            />
          </Grid>
        );
      case spacePurchaseSteps.CONFIRMATION:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumb items={NEW_SPACE_STEPS_CONFIRMATION} />
            <NewSpaceConfirmationPage
              navigateToPreviousStep={navigateToPreviousStep}
              billingDetails={billingDetails}
              paymentMethod={paymentMethodInfo}
              selectedPlan={selectedPlan}
              onConfirm={onConfirm}
            />
          </Grid>
        );
      case spacePurchaseSteps.RECEIPT:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumb items={NEW_SPACE_STEPS_CONFIRMATION} />
            <NewSpaceReceiptPage
              selectedPlan={selectedPlan}
              spaceName={spaceName}
              organizationId={organizationId}
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
              organizationId={organizationId}
              selectPlan={selectPlan}
              canCreateCommunityPlan={canCreateCommunityPlan}
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
  organizationId: PropTypes.string,
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
