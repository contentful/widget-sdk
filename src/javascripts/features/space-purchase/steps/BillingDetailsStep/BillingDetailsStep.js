import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { isEmpty } from 'lodash';

import { Heading, Card, Typography, Subheading } from '@contentful/forma-36-react-components';
import { Grid } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';

import { PaymentSummary } from '../../components/PaymentSummary';
import { BillingDetailsForm } from 'features/organization-billing';
import { actions, SpacePurchaseState } from '../../context';

const styles = {
  grid: css({
    alignItems: 'start',
  }),
  sectionHeading: css({
    marginBottom: tokens.spacingL,
    fontWeight: tokens.fontWeightMedium,
  }),
  card: css({
    padding: tokens.spacingXl,
    borderRadius: '4px',
  }),
};

export const BillingDetailsStep = ({ onBack, onSubmit }) => {
  const {
    state: { billingDetails },
    dispatch,
  } = useContext(SpacePurchaseState);

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
        <Card className={styles.card} testId="billing-details.card">
          <Typography>
            <Subheading className={styles.cardTitle} element="h3" testId="billing-details.heading">
              {isEmpty(billingDetails) ? 'Add' : 'Update'} your billing details{' '}
              <span role="img" aria-label="Mailbox closed">
                📫
              </span>
            </Subheading>
          </Typography>

          <BillingDetailsForm
            onSubmit={(newBillingDetails) => {
              dispatch({ type: actions.SET_BILLING_DETAILS, payload: newBillingDetails });

              onSubmit();
            }}
            onCancel={onBack}
            submitText="Continue"
            cancelText="Back"
            billingDetails={billingDetails}
          />
        </Card>
        <PaymentSummary />
      </Grid>
    </section>
  );
};

BillingDetailsStep.propTypes = {
  onBack: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
