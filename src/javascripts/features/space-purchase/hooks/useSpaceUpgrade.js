import { useCallback, useEffect, useContext } from 'react';

import { changeSpacePlan } from 'account/pricing/PricingDataProvider';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { go } from 'states/Navigator';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { useAsyncFn } from 'core/hooks/useAsync';

import { SpacePurchaseState } from '../context';
import { useSessionMetadata } from './useSessionMetadata';

const upgradePlan = (space, plan, sessionMetadata) => async () => {
  const endpoint = createSpaceEndpoint(space.sys.id);
  let result;

  try {
    result = await changeSpacePlan(endpoint, plan.sys.id);

    trackEvent(EVENTS.SPACE_TYPE_CHANGE, sessionMetadata, { selectedPlan: plan });
  } catch (error) {
    trackEvent(EVENTS.ERROR, sessionMetadata, {
      errorType: 'UpgradeError',
      error,
    });
    throw error;
  }

  return result;
};

export function useSpaceUpgrade(shouldActivate) {
  const {
    state: { currentSpace, selectedPlan },
  } = useContext(SpacePurchaseState);

  const sessionMetadata = useSessionMetadata();

  const [
    { isLoading: isUpgradingSpace, data: upgradedSpace, error: upgradeError },
    runSpaceUpgrade,
  ] = useAsyncFn(
    useCallback(upgradePlan(currentSpace, selectedPlan, sessionMetadata), [currentSpace])
  );

  useEffect(() => {
    if (shouldActivate) {
      runSpaceUpgrade();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldActivate]);

  const goToCreatedSpace = async () => {
    await go({
      path: ['spaces', 'detail'],
      params: { spaceId: currentSpace.sys.id },
    });
  };

  const buttonAction = upgradeError ? runSpaceUpgrade : goToCreatedSpace;

  return {
    isUpgradingSpace,
    upgradeError,
    buttonAction,
    upgradedSpace,
  };
}
