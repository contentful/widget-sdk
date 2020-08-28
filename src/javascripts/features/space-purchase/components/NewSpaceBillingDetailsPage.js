import React from 'react';
import PropTypes from 'prop-types';

import { Heading } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import { Grid } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';
import { OrderSummary } from './OrderSummary';
import { BillingDetailsForm } from './BillingDetailsForm';

const styles = {
  sectionHeading: css({
    fontWeight: tokens.fontWeightMedium,
    fontSize: tokens.fontSize2Xl,
    marginBottom: tokens.spacingL,
  }),
  addSpaceAtBottom: css({
    marginBottom: tokens.spacingXl,
  }),
};

export const NewSpaceBillingDetailsPage = ({
  navigateToPreviousStep,
  onSubmitBillingDetails,
  selectedPlan,
}) => {
  return (
    <section
      className={styles.addSpaceAtBottom}
      aria-labelledby="new-space-billing-details-section"
      data-test-id="new-space-billing-details-section">
      <Heading
        id="new-space-billing-details-section-heading"
        element="h2"
        testId="space-selection.heading"
        className={styles.sectionHeading}>
        Complete your payment
      </Heading>
      <Grid columns="60% auto" rows={1} columnGap="spacing2Xl">
        <BillingDetailsForm
          onSubmitBillingDetails={onSubmitBillingDetails}
          navigateToPreviousStep={navigateToPreviousStep}
        />
        <OrderSummary selectedPlan={selectedPlan} />
      </Grid>
    </section>
  );
};

NewSpaceBillingDetailsPage.propTypes = {
  navigateToPreviousStep: PropTypes.func.isRequired,
  onSubmitBillingDetails: PropTypes.func.isRequired,
  selectedPlan: PropTypes.object,
};
