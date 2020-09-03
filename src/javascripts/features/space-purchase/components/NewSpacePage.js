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

import { SPACE_PURCHASE_TYPES } from '../utils/spacePurchaseContent';

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

const SPACE_SELECTION = 0;
const SPACE_DETAILS = 1;
const BILLING_DETAILS = 2;
const CARD_DETAILS = 3;

const PURCHASE_FLOW_STEPS = [SPACE_SELECTION, SPACE_DETAILS, BILLING_DETAILS, CARD_DETAILS];

export const NewSpacePage = ({ organizationId, templatesList, productRatePlans }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [spaceName, setSpaceName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingDetails, setBillingDetails] = useState({});
  const [_paymentMethodRefId, setPaymentMethodRefId] = useState(null);

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
              onSuccess={onSubmitPaymentMethod}
              selectedPlan={selectedPlan}
            />
          </Grid>
        );
      default:
        // Return step 1: SPACE_SELECTION
        return (
          <Grid columns={1} rows="repeat(3, 'auto')" rowGap="spacingM">
            <Breadcrumb items={NEW_SPACE_STEPS} />
            <SpaceSelection organizationId={organizationId} selectPlan={selectPlan} />
            <NewSpaceFAQ />
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
};
