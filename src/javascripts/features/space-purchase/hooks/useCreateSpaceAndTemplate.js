import { useCallback, useEffect } from 'react';

import { changeSpacePlan } from 'account/pricing/PricingDataProvider';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { go } from 'states/Navigator';
import { makeNewSpace, createTemplate } from '../utils/spaceCreation';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { useAsyncFn } from 'core/hooks/useAsync';

const fetchSpace = (organizationId, selectedPlan, spaceName, sessionMetadata) => async () => {
  try {
    const newSpace = await makeNewSpace(organizationId, selectedPlan, spaceName);

    trackEvent(EVENTS.SPACE_CREATED, sessionMetadata, {
      selectedPlan,
    });

    return newSpace;
  } catch (error) {
    trackEvent(EVENTS.ERROR, sessionMetadata, {
      errorType: 'CreateSpaceError',
      error,
    });

    throw error;
  }
};

const fetchTemplate = (newSpace, selectedTemplate, sessionMetadata) => async () => {
  try {
    await createTemplate(newSpace, selectedTemplate);

    trackEvent(EVENTS.SPACE_TEMPLATE_CREATED, sessionMetadata, {
      selectedTemplate,
    });
  } catch (error) {
    trackEvent(EVENTS.ERROR, sessionMetadata, {
      errorType: 'CreateTemplateError',
      error,
    });

    throw error;
  }
};

const upgradePlan = (space, plan, sessionMetadata) => async () => {
  try {
    const endpoint = createSpaceEndpoint(space.sys.id);
    await changeSpacePlan(endpoint, plan.sys.id);
    trackEvent(EVENTS.SPACE_TYPE_CHANGE, sessionMetadata, { selectedPlan: plan });
  } catch (error) {
    trackEvent(EVENTS.ERROR, sessionMetadata, {
      errorType: 'UpgradeError',
      error,
    });
    throw error;
  }
};

export function useSpaceCreation(organizationId, selectedPlan, spaceName, sessionMetadata) {
  const [
    { isLoading: isCreatingSpace, data: newSpace, error: spaceCreationError },
    runSpaceCreation,
  ] = useAsyncFn(
    useCallback(fetchSpace(organizationId, selectedPlan, spaceName, sessionMetadata), [])
  );

  useEffect(() => {
    runSpaceCreation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToCreatedSpace = async () => {
    await go({
      path: ['spaces', 'detail'],
      params: { spaceId: newSpace.sys.id },
    });
  };

  const buttonAction = spaceCreationError ? runSpaceCreation : goToCreatedSpace;

  return {
    isCreatingSpace,
    spaceCreationError,
    buttonAction,
    newSpace,
  };
}

export function useTemplateCreation(newSpace, selectedTemplate, sessionMetadata) {
  const [
    { isLoading: isCreatingTemplate, error: templateCreationError },
    runTemplateCreation,
  ] = useAsyncFn(
    useCallback(fetchTemplate(newSpace, selectedTemplate, sessionMetadata), [newSpace])
  );

  useEffect(() => {
    if (newSpace && selectedTemplate) {
      runTemplateCreation();
    }
  }, [newSpace, selectedTemplate, runTemplateCreation]);

  return {
    isCreatingTemplate,
    templateCreationError,
  };
}

export function useSpaceUpgrade(currentSpace, selectedPlan, sessionMetadata) {
  const [{ isLoading: isUpgradingSpace, error: upgradeError }, runSpaceUpgrade] = useAsyncFn(
    useCallback(upgradePlan(currentSpace, selectedPlan, sessionMetadata), [currentSpace])
  );

  useEffect(() => {
    runSpaceUpgrade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  };
}
