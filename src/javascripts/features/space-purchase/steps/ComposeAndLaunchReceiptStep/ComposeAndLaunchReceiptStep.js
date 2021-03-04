import React from 'react';

import { go } from 'states/Navigator';
import { getBrowserStorage } from 'core/services/BrowserStorage';

import { usePurchaseAddOn } from '../../hooks/usePurchaseAddOn';
import { ReceiptView } from '../../components/ReceiptView';

const store = getBrowserStorage();
const lastUsedSpaceId = store.get('lastUsedSpace');

export const ComposeAndLaunchReceiptStep = () => {
  const {
    isLoading: isPurchasingAddOn,
    error: addOnPurchaseError,
    retry: retryAddOnPurchase,
  } = usePurchaseAddOn();

  const pending = isPurchasingAddOn;
  const goToLastUsedSpace = () =>
    go({
      path: ['spaces', 'detail'],
      params: { spaceId: lastUsedSpaceId },
    });

  return (
    <section
      aria-labelledby="performance-receipt-section-heading"
      data-test-id="performance-receipt-section">
      <ReceiptView
        pending={pending}
        buttonAction={addOnPurchaseError ? retryAddOnPurchase : goToLastUsedSpace}
        error={addOnPurchaseError}
        selectedCompose
      />
    </section>
  );
};
