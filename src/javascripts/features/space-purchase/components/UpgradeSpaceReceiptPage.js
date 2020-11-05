import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { DisplayText, Button, Paragraph } from '@contentful/forma-36-react-components';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';

import { PaymentSummary } from './PaymentSummary';
import { Space as SpacePropType } from 'app/OrganizationSettings/PropTypes';
import { useSpaceUpgrade } from '../hooks/useCreateSpaceAndTemplate';

const styles = {
  grid: css({
    margin: `${tokens.spacing2Xl} auto 0`,
  }),
  sectionHeading: css({
    fontWeight: tokens.fontWeightMedium,
    marginBottom: tokens.spacingXs,
  }),
  successMsg: css({
    marginBottom: tokens.spacingXl,
  }),
  button: css({
    marginBottom: tokens.spacingXl,
  }),
  paymentSummaryContainer: css({
    maxWidth: '600px',
  }),
};

export const UpgradeSpaceReceiptPage = ({ selectedPlan, sessionMetadata, currentSpace }) => {
  const { isUpgradingSpace, upgradeError, buttonAction } = useSpaceUpgrade(
    currentSpace,
    selectedPlan,
    sessionMetadata
  );

  return (
    <section
      aria-labelledby="new-space-receipt-section-heading"
      data-test-id="new-space-receipt-section">
      <Flex className={styles.grid} flexDirection="column" alignItems="center">
        <DisplayText
          id="new-space-receipt-section-heading"
          element="h2"
          testId="new-space-receipt-section-heading"
          className={styles.sectionHeading}>
          {isUpgradingSpace && (
            <>
              Hang on, we’re changing your space{' '}
              <span
                role="img"
                data-test-id="receipt.loading-envelope"
                aria-label="Envelope with arrow">
                📩
              </span>
            </>
          )}
          {!isUpgradingSpace && upgradeError && (
            <>
              Oh dear, we had some trouble changing your space{' '}
              <span
                role="img"
                data-test-id="receipt.error-face"
                aria-label="Face with eyes wide open">
                😳
              </span>
            </>
          )}
          {!isUpgradingSpace && !upgradeError && (
            <>
              Nice one!{' '}
              <span role="img" aria-label="Shopping bag">
                🛍
              </span>
            </>
          )}
        </DisplayText>
        <Paragraph className={styles.successMsg} testId="receipt.subtext">
          {!isUpgradingSpace && upgradeError && 'Don’t worry, simply retrigger the space change.'}
        </Paragraph>
        <Button
          testId="receipt-page.redirect-to-upgraded-space"
          loading={isUpgradingSpace}
          disabled={isUpgradingSpace}
          onClick={buttonAction}
          className={styles.button}>
          {upgradeError ? 'Retrigger space change' : `Take me to ${currentSpace.name}`}
        </Button>
        <div className={styles.paymentSummaryContainer}>
          <PaymentSummary isReceipt />
        </div>
      </Flex>
    </section>
  );
};

UpgradeSpaceReceiptPage.propTypes = {
  selectedPlan: PropTypes.object.isRequired,
  sessionMetadata: PropTypes.object.isRequired,
  currentSpace: SpacePropType,
};
