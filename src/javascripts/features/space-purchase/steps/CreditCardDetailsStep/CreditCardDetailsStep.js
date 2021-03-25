import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { Heading, Card, Subheading, Notification } from '@contentful/forma-36-react-components';
import { Grid } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import * as logger from 'services/logger';
import * as TokenStore from 'services/TokenStore';
import {
  ZuoraCreditCardIframe,
  getCountryCodeFromName,
  createBillingDetails,
  setDefaultPaymentMethod,
  getDefaultPaymentMethod,
} from 'features/organization-billing';
import { PaymentSummary } from '../../components/PaymentSummary';
import { actions, SpacePurchaseState } from '../../context';
import { EVENTS } from '../../utils/analyticsTracking';

const styles = {
  grid: css({
    alignItems: 'start',
  }),
  sectionHeading: css({
    fontWeight: tokens.fontWeightMedium,
    marginBottom: tokens.spacingL,
  }),
  card: css({
    display: 'flex',
    flexDirection: 'column',
    padding: tokens.spacingXl,
    borderRadius: '4px',
  }),
  cardTitle: css({
    marginBottom: tokens.spacingL,
  }),
};

async function createBillingPaymentDetails(organizationId, billingDetails, refId) {
  const newBillingDetails = {
    ...billingDetails,
    refid: refId,
  };

  await createBillingDetails(organizationId, newBillingDetails);
  await setDefaultPaymentMethod(organizationId, refId);
  const [paymentMethod] = await Promise.all([
    getDefaultPaymentMethod(organizationId),
    TokenStore.refresh(),
  ]);

  return paymentMethod;
}

export const CreditCardDetailsStep = ({ track, onBack, onSubmit }) => {
  const {
    state: { organization, billingDetails },
    dispatch,
  } = useContext(SpacePurchaseState);

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
          <Subheading className={styles.cardTitle} element="h3">
            Add your credit card{' '}
            <span role="img" aria-label="Credit card">
              💳
            </span>
          </Subheading>
          <ZuoraCreditCardIframe
            organizationId={organization.sys.id}
            countryCode={getCountryCodeFromName(billingDetails.country)}
            onSuccess={async ({ refId }) => {
              track(EVENTS.PAYMENT_DETAILS_ENTERED);

              try {
                const paymentMethod = await createBillingPaymentDetails(
                  organization.sys.id,
                  billingDetails,
                  refId
                );

                dispatch({ type: actions.SET_PAYMENT_DETAILS, payload: paymentMethod });
              } catch (error) {
                track(EVENTS.ERROR, {
                  errorType: 'CreateAndSaveBillingDetails',
                  error,
                });

                logger.captureError(error, {
                  organizationId: organization.sys.id,
                });

                Notification.error('Your credit card couldn’t be saved. Please try again.');

                return;
              }

              onSubmit();
            }}
            onError={(error) => {
              logger.captureError(new Error('Zuora credit card iframe error'), {
                error,
                location: 'account.organizations.subscription_new.new_space',
              });

              Notification.error(
                'Something went wrong. Refresh this page and contact us if you continue to see this.'
              );
            }}
            onCancel={onBack}
            cancelText="Back"
          />
        </Card>
        <PaymentSummary />
      </Grid>
    </section>
  );
};

CreditCardDetailsStep.propTypes = {
  onBack: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  track: PropTypes.func.isRequired,
};
