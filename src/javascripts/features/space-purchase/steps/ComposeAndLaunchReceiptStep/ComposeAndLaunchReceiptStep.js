import React, { useEffect, useCallback } from 'react';

import { getSpace } from 'services/TokenStore';
import { go } from 'states/Navigator';
import { useAsyncFn } from 'core/hooks/useAsync';
import { getBrowserStorage } from 'core/services/BrowserStorage';

import { ReceiptView } from '../../components/ReceiptView';

const store = getBrowserStorage();
const lastUsedSpaceId = store.get('lastUsedSpace');

const fetchLastUsedSpace = () => async () => {
  return await getSpace(lastUsedSpaceId);
};

export const ComposeAndLaunchReceiptStep = () => {
  const [{ isLoading, data: lastUsedSpace }, runGetSpace] = useAsyncFn(
    useCallback(fetchLastUsedSpace(), [])
  );

  useEffect(() => {
    runGetSpace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      aria-labelledby="performance-receipt-section-heading"
      data-test-id="performance-receipt-section">
      <ReceiptView
        pending={isLoading}
        buttonAction={() =>
          go({
            path: ['spaces', 'detail'],
            params: { spaceId: lastUsedSpaceId },
          })
        }
        buttonLabel={`Take me to ${lastUsedSpace?.name}`}
        selectedCompose
      />
    </section>
  );
};
