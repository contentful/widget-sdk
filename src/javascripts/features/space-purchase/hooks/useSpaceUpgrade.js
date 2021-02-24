import { useCallback, useEffect, useContext } from 'react';

import { changeSpacePlan } from 'account/pricing/PricingDataProvider';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { go } from 'states/Navigator';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { useAsyncFn } from 'core/hooks/useAsync';
import * as TokenStore from 'services/TokenStore';

import { SpacePurchaseState } from '../context';
import { useSessionMetadata } from './useSessionMetadata';

export const SPACE_CHANGE_ERROR = 'SpaceChangeError';

class SpaceChangeError extends Error {
  constructor(...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    this.name = SPACE_CHANGE_ERROR;
  }
}

const upgradePlan = (space, plan, sessionMetadata) => async () => {
  const endpoint = createSpaceEndpoint(space.sys.id);
  let result;

  try {
    result = await changeSpacePlan(endpoint, plan.sys.id);

    trackEvent(EVENTS.SPACE_TYPE_CHANGE, sessionMetadata, { selectedPlan: plan });
    await TokenStore.refresh();
  } catch (error) {
    trackEvent(EVENTS.ERROR, sessionMetadata, {
      errorType: SPACE_CHANGE_ERROR,
      error,
    });
    throw new SpaceChangeError(error);
  }

  return result;
};

export function useSpaceUpgrade(shouldActivate) {
  const {
    state: { currentSpace, selectedPlan },
  } = useContext(SpacePurchaseState);

  const sessionMetadata = useSessionMetadata();

  const [{ isLoading: isUpgradingSpace, data: upgradedSpace, error }, runSpaceUpgrade] = useAsyncFn(
    useCallback(upgradePlan(currentSpace, selectedPlan, sessionMetadata), [currentSpace])
  );

  useEffect(() => {
    if (shouldActivate) {
      runSpaceUpgrade();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldActivate]);

  const goToUpdatedSpace = async () => {
    await go({
      path: ['spaces', 'detail'],
      params: { spaceId: currentSpace.sys.id },
    });
  };

  const buttonAction = error ? runSpaceUpgrade : goToUpdatedSpace;

  return {
    isUpgradingSpace,
    error,
    buttonAction,
    upgradedSpace,
  };
}
