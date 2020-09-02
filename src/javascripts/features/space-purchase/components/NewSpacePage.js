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

  const onChangeSelectedTemplate = (changedTemplate) => {
    setSelectedTemplate(changedTemplate);
  };

  const onChangeSpaceName = (changedSpaceName) => {
    setSpaceName(changedSpaceName);
  };

  const navigateToNextStep = () => {
    if (currentStep + 1 < PURCHASE_FLOW_STEPS.length) {
      setCurrentStep(currentStep + 1);
      // It does not matter what state is pushed to history, just that a state is pushed to mimic a new page load.
      window.history.pushState('does not matter', null);
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

  const navigateToPreviousStep = useCallback(
    (shouldRemovePushState = true) => {
      // If the user clicks the browsers back button, window.history.back() is already called which removes the pushedState,
      // so we only want to update the current step. However if the user clicks a navigateBack button, we also want to remove
      // the pushedState, so we call window.history.back() to remove the pushedState, which also as a result calls this function again
      // and properly updates the currentStep
      if (shouldRemovePushState) {
        window.history.back();
      } else if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    },
    [currentStep]
  );

  const backButtonClickHandler = useCallback(() => {
    navigateToPreviousStep(false);
  }, [navigateToPreviousStep]);

  useEffect(() => {
    // Adds a listener for the back button page
    window.addEventListener('popstate', backButtonClickHandler);

    return () => {
      window.removeEventListener('popstate', backButtonClickHandler);
    };
  }, [backButtonClickHandler]);

  const onSubmitSpaceDetails = () => {
    // Add analytics here

    navigateToNextStep();
  };
  const onSubmitBillingDetails = (billingDetails) => {
    // Add analytics here

    setBillingDetails(billingDetails);
    navigateToNextStep();
  };

  const getComponentForStep = (currentStep) => {
    switch (currentStep) {
      case SPACE_DETAILS:
        return (
          <Grid columns={1} rows="repeat(2, 'auto')" columnGap="none" rowGap="spacingM">
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
          <Grid columns={1} rows="repeat(2, 'auto')" columnGap="none" rowGap="spacingM">
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
          <Grid columns={1} rows="repeat(2, 'auto')" columnGap="none" rowGap="spacingM">
            <Breadcrumb items={NEW_SPACE_STEPS_PAYMENT} />
            <NewSpaceCardDetailsPage
              navigateToPreviousStep={navigateToPreviousStep}
              selectedPlan={selectedPlan}
            />
          </Grid>
        );
      default:
        // Return step 1: SPACE_SELECTION
        return (
          <Grid columns={1} rows="repeat(3, 'auto')" columnGap="none" rowGap="spacingM">
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
