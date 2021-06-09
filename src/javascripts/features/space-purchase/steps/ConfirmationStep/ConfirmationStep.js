import React, { useContext } from 'react';
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
import { Grid, Flex } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { EVENTS } from '../../utils/analyticsTracking';
import { useRouteNavigate } from 'core/react-routing';
import { isOwner as isOrgOwner } from 'services/OrganizationRoles';

import { BillingDetailsLoading, CreditCardDetailsLoading } from 'features/organization-billing';

import { CreditCardInformation } from '../../components/CreditCardInformation';
import { PaymentSummary } from '../../components/PaymentSummary';
import { BillingInformation } from './BillingInformation';
import { SpacePurchaseState } from '../../context';

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

export const ConfirmationStep = ({ track, onBack, onSubmit }) => {
  const {
    state: { organization, billingDetails, paymentDetails },
  } = useContext(SpacePurchaseState);
  const routeNavigate = useRouteNavigate();

  const userIsOrgOwner = isOrgOwner(organization);
  const showEditLink = organization.isBillable;

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
        {userIsOrgOwner && (
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
                      track(EVENTS.INTERNAL_LINK_CLICKED, {
                        state: 'account.organizations.billing',
                        intent: 'edit_billing',
                      });

                      routeNavigate({
                        path: 'organizations.billing',
                        orgId: organization.sys.id,
                      });
                    }}>
                    Edit
                  </TextLink>
                </Paragraph>
              )}
            </Flex>
            <Grid className={styles.grid} columns="1fr 1fr" rows={1} columnGap="spacingXl">
              {!billingDetails && (
                <>
                  <CreditCardDetailsLoading />
                  <BillingDetailsLoading />
                </>
              )}
              {billingDetails && (
                <>
                  <CreditCardInformation creditCardInfo={paymentDetails} />
                  <BillingInformation billingDetails={billingDetails} />
                </>
              )}
            </Grid>
            <Flex justifyContent="flex-end">
              <Button onClick={onBack} testId="navigate-back" buttonType="muted">
                Back
              </Button>
              <Button
                className={styles.continueButton}
                onClick={onSubmit}
                testId="confirm-purchase-button"
                buttonType="positive">
                Confirm payment
              </Button>
            </Flex>
          </Card>
        )}
        <PaymentSummary showButtons={!userIsOrgOwner} onConfirm={onSubmit} onBack={onBack} />
      </Grid>
    </section>
  );
};

ConfirmationStep.propTypes = {
  track: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
