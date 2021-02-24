import { useCallback, useEffect, useContext } from 'react';

import { go } from 'states/Navigator';
import { makeNewSpace } from '../utils/spaceCreation';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { useAsyncFn } from 'core/hooks/useAsync';

import { SpacePurchaseState } from '../context';
import { useSessionMetadata } from './useSessionMetadata';

export const SPACE_CREATION_ERROR = 'CreateSpaceError';

class SpaceCreationError extends Error {
  constructor(...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    this.name = SPACE_CREATION_ERROR;
  }
}

const createSpace = (organizationId, selectedPlan, spaceName, sessionMetadata) => async () => {
  try {
    const newSpace = await makeNewSpace(organizationId, selectedPlan.sys.id, spaceName);

    trackEvent(EVENTS.SPACE_CREATED, sessionMetadata, {
      selectedPlan,
    });

    return newSpace;
  } catch (error) {
    trackEvent(EVENTS.ERROR, sessionMetadata, {
      errorType: 'CreateSpaceError',
      error,
    });

    throw new SpaceCreationError(error);
  }
};

export function useSpaceCreation() {
  const {
    state: { organization, selectedPlan, spaceName },
  } = useContext(SpacePurchaseState);

  const sessionMetadata = useSessionMetadata();

  const [{ isLoading: isCreatingSpace, data: newSpace, error }, runSpaceCreation] = useAsyncFn(
    useCallback(createSpace(organization.sys.id, selectedPlan, spaceName, sessionMetadata), [])
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

  const buttonAction = error ? runSpaceCreation : goToCreatedSpace;

  return {
    isCreatingSpace,
    error,
    buttonAction,
    newSpace,
  };
}
