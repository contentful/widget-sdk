import React, { useContext } from 'react';
import { css } from 'emotion';

import { Button } from '@contentful/forma-36-react-components';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';

import { useSpaceUpgrade } from 'features/space-purchase/hooks/useSpaceUpgrade';
import { SpacePurchaseState } from 'features/space-purchase/context';
import { PaymentSummary } from '../../components/PaymentSummary';
import { ReceiptMessage } from '../../components/ReceiptMessage';

const styles = {
  grid: css({
    margin: `${tokens.spacing2Xl} auto 0`,
  }),
  button: css({
    marginTop: tokens.spacingXl,
    marginBottom: tokens.spacingXl,
  }),
  paymentSummaryContainer: css({
    maxWidth: '600px',
  }),
};

export const SpaceUpgradeReceiptStep = () => {
  const {
    state: { currentSpace },
  } = useContext(SpacePurchaseState);

  const { isUpgradingSpace, upgradeError, buttonAction } = useSpaceUpgrade();

  return (
    <section
      aria-labelledby="upgrade-receipt-section-heading"
      data-test-id="upgrade-receipt-section">
      <Flex className={styles.grid} flexDirection="column" alignItems="center">
        <ReceiptMessage pending={isUpgradingSpace} hasErrors={!!upgradeError} isUpgrade />

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
