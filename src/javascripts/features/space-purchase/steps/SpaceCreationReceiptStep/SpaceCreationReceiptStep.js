import React, { useContext } from 'react';

import { PlatformKind } from '../../utils/platformContent';
import { SpacePurchaseState } from '../../context';
import { useSpaceCreation } from '../../hooks/useSpaceCreation';
import { useTemplateCreation } from '../../hooks/useTemplateCreation';
import { useNavigationWarn } from '../../hooks/useNavigationWarn';
import { usePurchaseAddOn } from '../../hooks/usePurchaseAddOn';
import { ReceiptView } from '../../components/ReceiptView';

export const SpaceCreationReceiptStep = () => {
  const {
    state: { spaceName, selectedTemplate, selectedPlan, selectedPlatform },
  } = useContext(SpacePurchaseState);

  const { isCreatingSpace, error: spaceCreationError, buttonAction, newSpace } = useSpaceCreation();
  const { isCreatingTemplate, error: templateCreationError } = useTemplateCreation(
    newSpace,
    selectedTemplate
  );
  const {
    isLoading: isPurchasingAddOn,
    error: addOnPurchaseError,
    retry: retryAddOnPurchase,
  } = usePurchaseAddOn(!!newSpace);

  const pending = isCreatingSpace || isCreatingTemplate || isPurchasingAddOn;

  const selectedCompose = selectedPlatform?.type === PlatformKind.WEB_APP_COMPOSE_LAUNCH;

  useNavigationWarn(selectedPlan, pending);

  return (
    <section
      aria-labelledby="new-space-receipt-section-heading"
      data-test-id="new-space-receipt-section">
      <ReceiptView
        pending={pending}
        planName={selectedPlan.name}
        spaceName={spaceName}
        spaceId={newSpace?.sys.id}
        buttonAction={(addOnPurchaseError && retryAddOnPurchase) || buttonAction}
        error={spaceCreationError || addOnPurchaseError || templateCreationError}
        selectedCompose={selectedCompose}
      />
    </section>
  );
};
