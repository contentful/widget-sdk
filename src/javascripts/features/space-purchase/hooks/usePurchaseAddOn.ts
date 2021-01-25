import { useEffect, useCallback } from 'react';
import { useSpacePurchaseState, State } from '../context';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { addProductRatePlanToSubscription, ProductRatePlan } from 'features/pricing-entities';
import { useAsyncFn } from 'core/hooks/useAsync';
import type { Organization } from 'core/services/SpaceEnvContext/types';
import type { SetRequired } from '../types';

import { PlatformKind } from '../utils/platformContent';

type ContextState = SetRequired<State, 'organization' | 'composeProductRatePlan'>;

const purchaseComposeLaunch = (
  organization: Organization,
  composeProductRatePlan: ProductRatePlan
) => async () => {
  const endpoint = createOrganizationEndpoint(organization.sys.id);

  await addProductRatePlanToSubscription(endpoint, composeProductRatePlan.sys.id);
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
    state: { organization, selectedPlatform, composeProductRatePlan },
  } = useSpacePurchaseState<ContextState>();

  const [{ isLoading, error }, callPurchase] = useAsyncFn(
    useCallback(purchaseComposeLaunch(organization, composeProductRatePlan), [])
  );

  useEffect(() => {
    if (shouldBegin && selectedPlatform?.type === PlatformKind.SPACE_COMPOSE_LAUNCH) {
      callPurchase();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldBegin]);

  return { isLoading, error };
}
