import { useEffect, useCallback } from 'react';
import { useSpacePurchaseState, State } from '../context';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { addProductRatePlanToSubscription, ProductRatePlan } from 'features/pricing-entities';
import { useAsyncFn } from 'core/hooks/useAsync';
import type { Organization } from 'core/services/SpaceEnvContext/types';
import type { SetRequired } from '../types';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { useSessionMetadata } from './useSessionMetadata';
import { clearCachedProductCatalogFlags } from 'data/CMA/ProductCatalog';
import * as TokenStore from 'services/TokenStore';

import { PlatformKind } from '../utils/platformContent';

export const ADD_ON_PURCHASE_ERROR = 'addOnPurchaseError';

class AddOnPurchaseError extends Error {
  constructor(...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    this.name = ADD_ON_PURCHASE_ERROR;
  }
}

type ContextState = SetRequired<State, 'organization' | 'composeAndLaunchProductRatePlan'>;

const purchaseComposeLaunch = (
  organization: Organization,
  composeAndLaunchProductRatePlan: ProductRatePlan,
  sessionMetadata: unknown,
  selectedPlan: State['selectedPlan']
) => async () => {
  const endpoint = createOrganizationEndpoint(organization.sys.id);

  try {
    await addProductRatePlanToSubscription(endpoint, composeAndLaunchProductRatePlan.sys.id);

    trackEvent(EVENTS.PERFORMANCE_PACKAGE_PURCHASED, sessionMetadata, {
      selectedPlan,
    });

    clearCachedProductCatalogFlags();
    await TokenStore.refresh();
    return true;
  } catch (error) {
    trackEvent(EVENTS.ERROR, sessionMetadata, {
      errorType: 'PurchaseComposeAndLaunchError',
      error,
    });

    throw new AddOnPurchaseError(error);
  }
};

/**
 * Purchases the compose + launch product for the current organization.
 *
 * `shouldBegin` can either be a changing boolean value if the API call depends on another API
 * call (e.g. space creation), or simply instantiated with `true` to start immediately.
 *
 * @param shouldBegin denotes whether the purchase should begin (via the useEffect hook).
 */
export function usePurchaseAddOn(shouldBegin = true) {
  const {
    state: { organization, selectedPlatform, composeAndLaunchProductRatePlan, selectedPlan },
  } = useSpacePurchaseState<ContextState>();
  const sessionMetadata = useSessionMetadata();

  const [{ isLoading, error, data }, callPurchase] = useAsyncFn(
    useCallback(
      purchaseComposeLaunch(
        organization,
        composeAndLaunchProductRatePlan,
        sessionMetadata,
        selectedPlan
      ),
      []
    )
  );

  useEffect(() => {
    if (shouldBegin && selectedPlatform?.type === PlatformKind.WEB_APP_COMPOSE_LAUNCH) {
      callPurchase();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldBegin]);
  if (selectedPlatform?.type === PlatformKind.WEB_APP_COMPOSE_LAUNCH) {
    return { isLoading, error, data, retry: callPurchase };
  } else {
    // we pass isLoading: false because we expect false value not undefined
    return { isLoading: false, data: true };
  }
}
