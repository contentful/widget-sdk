import React, { useContext } from 'react';

import { useSpaceUpgrade } from 'features/space-purchase/hooks/useSpaceUpgrade';
import { usePurchaseAddOn } from '../../hooks/usePurchaseAddOn';
import { SpacePurchaseState } from 'features/space-purchase/context';
import { ReceiptView } from '../../components/ReceiptView';
import { PlatformKind } from '../../utils/platformContent';

export const SpaceUpgradeReceiptStep = () => {
  const {
    state: { currentSpace, selectedPlatform },
  } = useContext(SpacePurchaseState);

  const selectedCompose = selectedPlatform?.type === PlatformKind.WEB_APP_COMPOSE_LAUNCH;

  const {
    isLoading: isPurchasingAddOn,
    error: addOnPurchaseError,
    data: shouldActivateSpaceUpgrade,
    retry: retryAddOnPurchase,
  } = usePurchaseAddOn();
  const { isUpgradingSpace, error: upgradeError, buttonAction } = useSpaceUpgrade(
    shouldActivateSpaceUpgrade
  );

  const pending = isUpgradingSpace || isPurchasingAddOn;

  return (
    <section
      aria-labelledby="upgrade-receipt-section-heading"
      data-test-id="upgrade-receipt-section">
      <ReceiptView
        pending={pending}
        buttonAction={(addOnPurchaseError && retryAddOnPurchase) || buttonAction}
        buttonLabel={
          upgradeError || addOnPurchaseError ? 'Retry request' : `Take me to ${currentSpace.name}`
        }
        error={upgradeError || addOnPurchaseError}
        selectedCompose={selectedCompose}
        isSpaceUpgrade
      />
    </section>
  );
};
