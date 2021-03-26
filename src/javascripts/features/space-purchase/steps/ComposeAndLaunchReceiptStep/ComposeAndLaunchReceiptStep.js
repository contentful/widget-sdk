import React, { useMemo, useContext } from 'react';

import { go } from 'states/Navigator';
import { getBrowserStorage } from 'core/services/BrowserStorage';

import { usePurchaseAddOn } from '../../hooks/usePurchaseAddOn';
import { ReceiptView } from '../../components/ReceiptView';
import * as TokenStore from 'services/TokenStore';
import { SpacePurchaseState } from '../../context';

function getSpaceIdToRedirectTo(lastUsedSpaceId, organization) {
  const organizationSpaces = TokenStore.getSpacesByOrganization()[organization.sys.id];

  // If they don't have a lastUsedSpaceId, fetch the first spaceId they have access to from their organization
  const redirectSpaceId =
    organizationSpaces.find((space) => {
      return space.sys.id === lastUsedSpaceId;
    })?.sys?.id ?? organizationSpaces[0].sys.id;

  return redirectSpaceId;
}

export const ComposeAndLaunchReceiptStep = () => {
  const {
    state: { organization },
  } = useContext(SpacePurchaseState);

  const lastUsedSpaceId = useMemo(() => {
    const store = getBrowserStorage();
    return store.get('lastUsedSpace');
  }, []);
  const spaceIdToRedirectTo = getSpaceIdToRedirectTo(lastUsedSpaceId, organization);

  const {
    isLoading: isPurchasingAddOn,
    error: addOnPurchaseError,
    retry: retryAddOnPurchase,
  } = usePurchaseAddOn();

  const pending = isPurchasingAddOn;
  const goToLastUsedSpace = () =>
    go({
      path: ['spaces', 'detail'],
      params: { spaceId: spaceIdToRedirectTo },
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
