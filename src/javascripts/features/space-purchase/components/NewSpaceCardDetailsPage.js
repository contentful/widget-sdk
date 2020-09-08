import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { Heading, Card, Subheading, Button } from '@contentful/forma-36-react-components';
import { Grid } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';

import { OrderSummary } from './OrderSummary';

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

export const NewSpaceCardDetailsPage = ({ navigateToPreviousStep, selectedPlan }) => {
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
          <Button onClick={navigateToPreviousStep} testId="navigate-back" buttonType="muted">
            Back
          </Button>
        </Card>
        <OrderSummary selectedPlan={selectedPlan} />
      </Grid>
    </section>
  );
};

NewSpaceCardDetailsPage.propTypes = {
  navigateToPreviousStep: PropTypes.func.isRequired,
  selectedPlan: PropTypes.object,
};
