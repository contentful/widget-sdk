import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { Heading } from '@contentful/forma-36-react-components';
import { Grid } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';

import { PaymentSummary } from './PaymentSummary';
import { BillingDetailsForm } from 'features/organization-billing';

const styles = {
  grid: css({
    alignItems: 'start',
  }),
  sectionHeading: css({
    marginBottom: tokens.spacingL,
    fontWeight: tokens.fontWeightMedium,
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
        <PaymentSummary selectedPlan={selectedPlan} />
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
