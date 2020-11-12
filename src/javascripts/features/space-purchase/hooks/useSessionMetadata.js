import { useContext } from 'react';

import { SpacePurchaseState } from '../context';

export function useSessionMetadata() {
  const {
    state: { organization, currentSpace, sessionId },
  } = useContext(SpacePurchaseState);

  return {
    sessionId,
    organizationId: organization.sys.id,
    ...(currentSpace && { spaceId: currentSpace.sys.id }),
  };
}
