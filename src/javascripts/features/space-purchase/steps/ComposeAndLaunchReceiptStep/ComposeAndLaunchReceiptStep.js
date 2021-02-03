import React from 'react';

import { go } from 'states/Navigator';
import { getBrowserStorage } from 'core/services/BrowserStorage';

import { usePurchaseAddOn } from '../../hooks/usePurchaseAddOn';
import { ReceiptView } from '../../components/ReceiptView';

const store = getBrowserStorage();
const lastUsedSpaceId = store.get('lastUsedSpace');

export const ComposeAndLaunchReceiptStep = () => {
  const { isLoading: isPurchasingAddOn, error: addOnPurchaseError } = usePurchaseAddOn();

  const pending = isPurchasingAddOn;
  const hasErrors = !!addOnPurchaseError;

  return (
    <section
      aria-labelledby="performance-receipt-section-heading"
      data-test-id="performance-receipt-section">
      <ReceiptView
        pending={pending}
        buttonAction={() =>
          go({
            path: ['spaces', 'detail'],
            params: { spaceId: lastUsedSpaceId },
          })
        }
        hasErrors={hasErrors}
        buttonLabel={'Take me to space home'}
        selectedCompose
      />
    </section>
  );
};
