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
import { EVENTS } from '../../utils/analyticsTracking';
import { go } from 'states/Navigator';

import {
  BillingDetailsLoading,
  CreditCardDetailsLoading,
  BillingDetailsPropType,
} from 'features/organization-billing';

import { CreditCardInformation } from '../../components/CreditCardInformation';
import { PaymentSummary } from '../../components/PaymentSummary';
import { BillingInformation } from './BillingInformation';

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
    path: 'account.organizations.billing',
    params: { orgId },
  });
};

export const ConfirmationStep = ({
  organizationId,
  navigateToPreviousStep,
  trackWithSession,
  billingDetails,
  paymentDetails,
  onConfirm,
  isLoadingBillingDetails,
  showBillingDetails,
  showEditLink,
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
        Complete your payment
      </Heading>
      <Grid className={styles.grid} columns="60% auto" rows={1} columnGap="spacing2Xl">
        {showBillingDetails && (
          <Card className={styles.card} testId="new-space-confirmation.billing-details">
            <Flex justifyContent="space-between">
              <Subheading className={styles.cardTitle} element="h3">
                Billing details{' '}
                <span role="img" aria-label="Credit card">
                  💳
                </span>
              </Subheading>
              {showEditLink && (
                <Paragraph>
                  <TextLink
                    testId="confirmation-page.edit-billing-link"
                    icon="ExternalLink"
                    onClick={() => {
                      trackWithSession(EVENTS.INTERNAL_LINK_CLICKED, {
                        state: 'account.organizations.billing',
                        intent: 'edit_billing',
                      });

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
                  <CreditCardInformation creditCardInfo={paymentDetails} />
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
        )}
        <PaymentSummary
          showButtons={!showBillingDetails}
          onConfirm={onConfirm}
          onBack={navigateToPreviousStep}
        />
      </Grid>
    </section>
  );
};

ConfirmationStep.propTypes = {
  organizationId: PropTypes.string.isRequired,
  navigateToPreviousStep: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  trackWithSession: PropTypes.func.isRequired,
  billingDetails: BillingDetailsPropType,
  paymentDetails: PropTypes.object,
  showEditLink: PropTypes.bool.isRequired,
  isLoadingBillingDetails: PropTypes.bool.isRequired,
  showBillingDetails: PropTypes.bool.isRequired,
};
