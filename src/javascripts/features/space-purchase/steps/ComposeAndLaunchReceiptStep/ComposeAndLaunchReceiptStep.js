import React, { useEffect, useCallback } from 'react';

import { getSpace } from 'services/TokenStore';
import { go } from 'states/Navigator';
import { useAsyncFn } from 'core/hooks/useAsync';
import { getBrowserStorage } from 'core/services/BrowserStorage';

import { usePurchaseAddOn } from '../../hooks/usePurchaseAddOn';
import { ReceiptView } from '../../components/ReceiptView';

const store = getBrowserStorage();
const lastUsedSpaceId = store.get('lastUsedSpace');

const fetchLastUsedSpace = () => async () => {
  return await getSpace(lastUsedSpaceId);
};

export const ComposeAndLaunchReceiptStep = () => {
  const { isLoading: isPurchasingAddOn, error: addOnPurchaseError } = usePurchaseAddOn();
  const [{ isLoading, data: lastUsedSpace }, runGetSpace] = useAsyncFn(
    useCallback(fetchLastUsedSpace(), [])
  );

  useEffect(() => {
    runGetSpace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pending = isLoading || isPurchasingAddOn;
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
        buttonLabel={`Take me to ${lastUsedSpace?.name}`}
        selectedCompose
      />
    </section>
  );
};
