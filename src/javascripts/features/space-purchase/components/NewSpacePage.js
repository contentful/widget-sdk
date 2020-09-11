import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import { Grid, NavigationIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { Workbench } from '@contentful/forma-36-react-components';

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

const SPACE_SELECTION = 0;
const SPACE_DETAILS = 1;
const BILLING_DETAILS = 2;
const CARD_DETAILS = 3;
const CONFIRMATION = 4;
const RECEIPT = 5;

const PURCHASE_FLOW_STEPS = [
  SPACE_SELECTION,
  SPACE_DETAILS,
  BILLING_DETAILS,
  CARD_DETAILS,
  CONFIRMATION,
  RECEIPT,
];

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
  const [_paymentMethodRefId, setPaymentMethodRefId] = useState(null);

  // Space Purchase content
  const { faqEntries } = usePageContent(pageContent);

  const onChangeSelectedTemplate = (changedTemplate) => {
    setSelectedTemplate(changedTemplate);
  };

  const onChangeSpaceName = (changedSpaceName) => {
    setSpaceName(changedSpaceName);
  };

  const navigateToNextStep = () => {
    const nextStep = currentStep + 1;

    if (nextStep < PURCHASE_FLOW_STEPS.length) {
      setCurrentStep(nextStep);
      // Save the step in the history's state to use when the browser's forward or back button is clicked
      window.history.pushState({ step: nextStep }, null);
    }
  };

  const selectPlan = (planType) => {
    if (!Object.values(SPACE_PURCHASE_TYPES).includes(planType)) {
      throw Error();
    }

    const selectedProductRatePlan = productRatePlans.find((productRatePlan) => {
      return productRatePlan.name.toLowerCase() === planType.toLowerCase();
    });

    setSelectedPlan(selectedProductRatePlan);
    navigateToNextStep();
  };

  const navigateToPreviousStep = () => {
    // We use window's history's back function so that the history state is also correctly updated.
    window.history.back();
  };

  const browserNavigationHandler = useCallback((e) => {
    const { step } = e.state;

    // If no step is set, it's the first step.
    setCurrentStep(step ? step : 0);
  }, []);

  useEffect(() => {
    // Adds a listener for the back and forward browser button
    window.addEventListener('popstate', browserNavigationHandler);

    return () => {
      window.removeEventListener('popstate', browserNavigationHandler);
    };
  }, [browserNavigationHandler]);

  const onSubmitSpaceDetails = () => {
    // Add analytics here

    navigateToNextStep();
  };
  const onSubmitBillingDetails = (billingDetails) => {
    // Add analytics here

    setBillingDetails(billingDetails);
    navigateToNextStep();
  };

  const onSubmitPaymentMethod = (refId) => {
    setPaymentMethodRefId(refId);
    // Add analytics here

    navigateToNextStep();
  };

  const onConfirm = () => {
    // Add analytics here
    // Creating the zoura subscription goes here

    navigateToNextStep();
  };

  const getComponentForStep = (currentStep) => {
    switch (currentStep) {
      case SPACE_DETAILS:
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
            />
          </Grid>
        );
      case BILLING_DETAILS:
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
      case CARD_DETAILS:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumb items={NEW_SPACE_STEPS_PAYMENT} />
            <NewSpaceCardDetailsPage
              organizationId={organizationId}
              navigateToPreviousStep={navigateToPreviousStep}
              billingCountryCode={billingDetails.country}
              onSuccess={onSubmitPaymentMethod}
              selectedPlan={selectedPlan}
              navigateToNextStep={navigateToNextStep}
            />
          </Grid>
        );
      case CONFIRMATION:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumb items={NEW_SPACE_STEPS_CONFIRMATION} />
            <NewSpaceConfirmationPage
              navigateToPreviousStep={navigateToPreviousStep}
              billingDetails={billingDetails}
              selectedPlan={selectedPlan}
              onConfirm={onConfirm}
            />
          </Grid>
        );
      case RECEIPT:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" rowGap="spacingM">
            <Breadcrumb items={NEW_SPACE_STEPS_CONFIRMATION} />
            <NewSpaceReceiptPage selectedPlan={selectedPlan} spaceName={spaceName} />
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
