import React, { useContext } from 'react';

import { useSpaceUpgrade } from 'features/space-purchase/hooks/useSpaceUpgrade';
import { usePurchaseAddOn } from '../../hooks/usePurchaseAddOn';
import { SpacePurchaseState } from 'features/space-purchase/context';
import { ReceiptView } from '../../components/ReceiptView';

export const SpaceUpgradeReceiptStep = () => {
  const {
    state: { currentSpace },
  } = useContext(SpacePurchaseState);

  const { isUpgradingSpace, upgradeError, buttonAction, upgradedSpace } = useSpaceUpgrade();
  const { isLoading: isPurchasingAddOn, error: addOnPurchaseError } = usePurchaseAddOn(
    !!upgradedSpace
  );

  const pending = isUpgradingSpace || isPurchasingAddOn;
  const hasErrors = !!(upgradeError || addOnPurchaseError);

  return (
    <section
      aria-labelledby="upgrade-receipt-section-heading"
      data-test-id="upgrade-receipt-section">
      <ReceiptView
        pending={pending}
        buttonAction={buttonAction}
        buttonLabel={upgradeError ? 'Retrigger space change' : `Take me to ${currentSpace.name}`}
        hasErrors={hasErrors}
        isSpaceUpgrade
      />
    </section>
  );
};
