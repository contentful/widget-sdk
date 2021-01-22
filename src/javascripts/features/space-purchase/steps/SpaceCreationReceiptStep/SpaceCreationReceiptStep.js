import React, { useContext } from 'react';

import { PLATFORM_TYPES } from '../../utils/platformContent';
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

  const { isCreatingSpace, spaceCreationError, buttonAction, newSpace } = useSpaceCreation();
  const { isCreatingTemplate, templateCreationError } = useTemplateCreation(
    newSpace,
    selectedTemplate
  );
  const { isLoading: isPurchasingAddOn, error: addOnPurchaseError } = usePurchaseAddOn(!!newSpace);

  const pending = isCreatingSpace || isCreatingTemplate || isPurchasingAddOn;
  const hasErrors = !!(spaceCreationError || addOnPurchaseError);

  const selectedCompose = selectedPlatform?.type === PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH;

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
        buttonAction={buttonAction}
        buttonLabel={hasErrors ? 'Retrigger space creation' : 'Take me to my new space'}
        hasErrors={hasErrors}
        templateCreationError={templateCreationError}
        selectedCompose={selectedCompose}
      />
    </section>
  );
};
