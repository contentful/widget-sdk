import React from 'react';
import PropTypes from 'prop-types';

import { Heading } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import { Grid } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';
import { OrderSummary } from './OrderSummary';
import { BillingDetailsForm } from './BillingDetailsForm';

const styles = {
  grid: css({
    alignItems: 'start',
  }),
  sectionHeading: css({
    fontWeight: tokens.fontWeightMedium,
    fontSize: tokens.fontSize2Xl,
    marginBottom: tokens.spacingL,
  }),
};

export const NewSpaceBillingDetailsPage = ({
  navigateToPreviousStep,
  savedBillingDetails,
  onSubmitBillingDetails,
  selectedPlan,
}) => {
  return (
    <section
      aria-labelledby="new-space-billing-details-section"
      data-test-id="new-space-billing-details-section">
      <Heading
        id="new-space-billing-details-section-heading"
        element="h2"
        testId="space-selection.heading"
        className={styles.sectionHeading}>
        Complete your payment
      </Heading>
      <Grid className={styles.grid} columns="60% auto" rows={1} columnGap="spacing2Xl">
        <BillingDetailsForm
          onSubmitBillingDetails={onSubmitBillingDetails}
          savedBillingDetails={savedBillingDetails}
          navigateToPreviousStep={navigateToPreviousStep}
        />
        <OrderSummary selectedPlan={selectedPlan} />
      </Grid>
    </section>
  );
};

NewSpaceBillingDetailsPage.propTypes = {
  navigateToPreviousStep: PropTypes.func.isRequired,
  savedBillingDetails: PropTypes.object,
  onSubmitBillingDetails: PropTypes.func.isRequired,
  selectedPlan: PropTypes.object,
};
