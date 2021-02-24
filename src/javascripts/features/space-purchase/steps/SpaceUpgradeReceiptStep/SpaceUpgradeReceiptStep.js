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
  } = usePurchaseAddOn();
  const { isUpgradingSpace, upgradeError, buttonAction } = useSpaceUpgrade(
    shouldActivateSpaceUpgrade
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
        selectedCompose={selectedCompose}
        isSpaceUpgrade
      />
    </section>
  );
};
