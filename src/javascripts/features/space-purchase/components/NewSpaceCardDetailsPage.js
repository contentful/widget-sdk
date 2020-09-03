import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { Heading, Card, Subheading, Button } from '@contentful/forma-36-react-components';
import { Grid } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';
import { ZuoraCreditCardIframe } from 'features/organization-billing';

import { PaymentSummary } from './PaymentSummary';

const styles = {
  grid: css({
    alignItems: 'start',
  }),
  sectionHeading: css({
    fontWeight: tokens.fontWeightMedium,
    fontSize: tokens.fontSize2Xl,
    marginBottom: tokens.spacingL,
  }),
  card: css({
    padding: tokens.spacingL,
  }),
};

export const NewSpaceCardDetailsPage = ({
  organizationId,
  billingCountryCode,
  navigateToPreviousStep,
  selectedPlan,
  onSuccess,
}) => {
  return (
    <section
      aria-labelledby="new-space-card-details-section"
      data-test-id="new-space-card-details-section">
      <Heading
        id="new-space-card-details-section-heading"
        element="h2"
        testId="space-selection.heading"
        className={styles.sectionHeading}>
        Complete your payment
      </Heading>
      <Grid className={styles.grid} columns="60% auto" rows={1} columnGap="spacing2Xl">
        <Card className={styles.card}>
          <Subheading element="h3">Add your credit card 💳</Subheading>
          <ZuoraCreditCardIframe
            organizationId={organizationId}
            countryCode={billingCountryCode}
            onSuccess={({ refId }) => {
              onSuccess(refId);
            }}
          />
          <Button onClick={navigateToPreviousStep} testId="navigate-back" buttonType="naked">
            Back
          </Button>
        </Card>
        <PaymentSummary selectedPlan={selectedPlan} />
      </Grid>
    </section>
  );
};

NewSpaceCardDetailsPage.propTypes = {
  organizationId: PropTypes.string.isRequired,
  billingCountryCode: PropTypes.string.isRequired,
  navigateToPreviousStep: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  selectedPlan: PropTypes.object,
};
