import { useEffect, useCallback } from 'react';
import { useSpacePurchaseState, State } from '../context';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { addProductRatePlanToSubscription, ProductRatePlan } from 'features/pricing-entities';
import { useAsyncFn } from 'core/hooks/useAsync';
import type { Organization } from 'core/services/SpaceEnvContext/types';
import type { SetRequired } from '../types';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { useSessionMetadata } from './useSessionMetadata';

import { PlatformKind } from '../utils/platformContent';

type ContextState = SetRequired<State, 'organization' | 'composeProductRatePlan'>;

const purchaseComposeLaunch = (
  organization: Organization,
  composeProductRatePlan: ProductRatePlan,
  sessionMetadata,
  selectedPlan
) => async () => {
  const endpoint = createOrganizationEndpoint(organization.sys.id);

  try {
    await addProductRatePlanToSubscription(endpoint, composeProductRatePlan.sys.id);

    trackEvent(EVENTS.PERFORMANCE_PACKAGE_PURCHASED, sessionMetadata, {
      selectedPlan,
    });
  } catch (error) {
    trackEvent(EVENTS.ERROR, sessionMetadata, {
      errorType: 'PurchasePerformancePackageError',
      error,
    });

    throw error;
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
    state: { organization, selectedPlatform, composeProductRatePlan, selectedPlan },
  } = useSpacePurchaseState<ContextState>();
  const sessionMetadata = useSessionMetadata();

  const [{ isLoading, error }, callPurchase] = useAsyncFn(
    useCallback(
      purchaseComposeLaunch(organization, composeProductRatePlan, sessionMetadata, selectedPlan),
      []
    )
  );

  useEffect(() => {
    if (shouldBegin && selectedPlatform?.type === PlatformKind.SPACE_COMPOSE_LAUNCH) {
      callPurchase();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldBegin]);

  return { isLoading, error };
}
