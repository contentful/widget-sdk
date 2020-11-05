import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { Heading, Card, Subheading, Notification } from '@contentful/forma-36-react-components';
import { Grid } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';

import * as logger from 'services/logger';
import { ZuoraCreditCardIframe } from 'features/organization-billing';
import { PaymentSummary } from './PaymentSummary';

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

export const NewSpaceCardDetailsPage = ({
  organizationId,
  billingCountryCode,
  navigateToPreviousStep,
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
          <Subheading className={styles.cardTitle} element="h3">
            Add your credit card{' '}
            <span role="img" aria-label="Credit card">
              💳
            </span>
          </Subheading>
          <ZuoraCreditCardIframe
            organizationId={organizationId}
            countryCode={billingCountryCode}
            onSuccess={async ({ refId }) => {
              try {
                await onSuccess(refId);
              } catch {
                Notification.error('Your credit card couldn’t be saved. Please try again.');
              }
            }}
            onError={(error) => {
              logger.logError('ZuoraIframeError', {
                location: 'account.organizations.subscription_new.new_space',
                ...error,
              });

              Notification.error(
                'Something went wrong. Refresh this page and contact us if you continue to see this.'
              );
            }}
            onCancel={navigateToPreviousStep}
            cancelText="Back"
          />
        </Card>
        <PaymentSummary />
      </Grid>
    </section>
  );
};

NewSpaceCardDetailsPage.propTypes = {
  organizationId: PropTypes.string.isRequired,
  billingCountryCode: PropTypes.string.isRequired,
  navigateToPreviousStep: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
