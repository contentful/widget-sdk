import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import {
  Card,
  Heading,
  Subheading,
  Button,
  Paragraph,
  TextLink,
} from '@contentful/forma-36-react-components';
import { Grid, Flex } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';
import { go } from 'states/Navigator';

import {
  BillingDetailsLoading,
  CreditCardDetailsLoading,
  BillingDetailsPropType,
} from 'features/organization-billing';

import { CreditCardInformation } from './CreditCardInformation';
import { BillingInformation } from './BillingInformation';
import { PaymentSummary } from './PaymentSummary';

const styles = {
  grid: css({
    alignItems: 'start',
    marginBottom: tokens.spacing2Xl,
  }),
  sectionHeading: css({
    fontWeight: tokens.fontWeightMedium,
    marginBottom: tokens.spacingL,
  }),
  card: css({
    padding: tokens.spacingXl,
    borderRadius: '4px',
  }),
  cardTitle: css({
    marginBottom: tokens.spacingL,
  }),
  continueButton: css({
    marginLeft: tokens.spacingM,
  }),
};

const redirectToEditPayment = (orgId) => {
  go({
    path: ['account', 'organizations', 'billing'],
    params: { orgId },
  });
};

export const NewSpaceConfirmationPage = ({
  organizationId,
  navigateToPreviousStep,
  selectedPlan,
  billingDetails,
  paymentMethod,
  onConfirm,
  isLoadingBillingDetails,
  hasBillingInformation,
}) => {
  return (
    <section
      aria-labelledby="new-space-confirmation-section"
      data-test-id="new-space-confirmation-section">
      <Heading
        id="new-space-confirmation-section-heading"
        element="h2"
        testId="space-selection.heading"
        className={styles.sectionHeading}>
        Confirm payment to finish!{' '}
        <span role="img" aria-label="Checkered flag">
          🏁
        </span>
      </Heading>
      <Grid className={styles.grid} columns="60% auto" rows={1} columnGap="spacing2Xl">
        <Card className={styles.card}>
          <Flex justifyContent="space-between">
            <Subheading className={styles.cardTitle} element="h3">
              Billing details{' '}
              <span role="img" aria-label="Credit card">
                💳
              </span>
            </Subheading>
            {hasBillingInformation && (
              <Paragraph>
                <TextLink
                  testId="confirmation-page.edit-billing-link"
                  icon="ExternalLink"
                  onClick={() => {
                    redirectToEditPayment(organizationId);
                  }}>
                  Edit
                </TextLink>
              </Paragraph>
            )}
          </Flex>
          <Grid className={styles.grid} columns="1fr 1fr" rows={1} columnGap="spacingXl">
            {isLoadingBillingDetails && (
              <>
                <CreditCardDetailsLoading />
                <BillingDetailsLoading />
              </>
            )}
            {!isLoadingBillingDetails && (
              <>
                <CreditCardInformation creditCardInfo={paymentMethod} />
                <BillingInformation billingDetails={billingDetails} />
              </>
            )}
          </Grid>
          <Flex justifyContent="flex-end">
            <Button onClick={navigateToPreviousStep} testId="navigate-back" buttonType="muted">
              Back
            </Button>
            <Button
              className={styles.continueButton}
              onClick={onConfirm}
              testId="confirm-purchase-button"
              buttonType="positive">
              Confirm payment
            </Button>
          </Flex>
        </Card>
        <PaymentSummary selectedPlan={selectedPlan} />
      </Grid>
    </section>
  );
};

NewSpaceConfirmationPage.propTypes = {
  organizationId: PropTypes.string.isRequired,
  navigateToPreviousStep: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  selectedPlan: PropTypes.object,
  billingDetails: BillingDetailsPropType,
  paymentMethod: PropTypes.object,
  hasBillingInformation: PropTypes.bool.isRequired,
  isLoadingBillingDetails: PropTypes.bool.isRequired,
};
