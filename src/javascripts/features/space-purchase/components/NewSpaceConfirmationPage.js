import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import {
  Card,
  Heading,
  Subheading,
  Button,
  Paragraph,
} from '@contentful/forma-36-react-components';
import { Grid, Flex } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';
import ExternalTextLink from 'app/common/ExternalTextLink';

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
  agreementNote: css({
    marginBottom: tokens.spacingXl,
  }),
};

// Mock creditCard information for now, to be replaced with Payment method API fetching the card details from Zoura
const mockCreditCardInfo = {
  number: '**** **** **** 1111',
  experationDate: '10/2030',
};

export const NewSpaceConfirmationPage = ({
  navigateToPreviousStep,
  selectedPlan,
  billingDetails,
  onConfirm,
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
        <Card className={styles.card}>
          <Subheading className={styles.cardTitle} element="h3">
            Billing Details{' '}
            <span role="img" aria-label="Credit card">
              💳
            </span>
          </Subheading>
          <Grid className={styles.grid} columns="1fr 1fr" rows={1} columnGap="spacingXl">
            <CreditCardInformation creditCardinfo={mockCreditCardInfo}></CreditCardInformation>
            <BillingInformation billingInfo={billingDetails}></BillingInformation>
          </Grid>
          <Paragraph className={styles.agreementNote}>
            By confirming you are agreeing to Contentful&apos;s{' '}
            <ExternalTextLink href="https://www.contentful.com/legal/de/marketplace-terms-of-service-customers/">
              terms of service
            </ExternalTextLink>
          </Paragraph>
          <Flex justifyContent="space-between">
            <Button onClick={navigateToPreviousStep} testId="navigate-back" buttonType="muted">
              Back
            </Button>
            <Button onClick={onConfirm} testId="confirm-purchase-button" buttonType="positive">
              Complete Payment
            </Button>
          </Flex>
        </Card>
        <PaymentSummary selectedPlan={selectedPlan} />
      </Grid>
    </section>
  );
};

NewSpaceConfirmationPage.propTypes = {
  navigateToPreviousStep: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  selectedPlan: PropTypes.object,
  billingDetails: PropTypes.object,
};
