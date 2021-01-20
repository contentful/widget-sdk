import React, { useContext } from 'react';

import { useSpaceUpgrade } from 'features/space-purchase/hooks/useSpaceUpgrade';
import { SpacePurchaseState } from 'features/space-purchase/context';
import { ReceiptView } from '../../components/ReceiptView';

export const SpaceUpgradeReceiptStep = () => {
  const {
    state: { currentSpace },
  } = useContext(SpacePurchaseState);

  const { isUpgradingSpace, upgradeError, buttonAction } = useSpaceUpgrade();

  return (
    <section
      aria-labelledby="upgrade-receipt-section-heading"
      data-test-id="upgrade-receipt-section">
      <ReceiptView
        pending={isUpgradingSpace}
        buttonAction={buttonAction}
        buttonLabel={upgradeError ? 'Retrigger space change' : `Take me to ${currentSpace.name}`}
        hasErrors={!!upgradeError}
        isSpaceUpgrade
      />
    </section>
  );
};
