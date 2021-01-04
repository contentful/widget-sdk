import { useState, useEffect } from 'react';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { createPubSubClientForSpace, PubSubClient } from 'services/PubSubService';
import noop from 'lodash/noop';

/**
 * A React hook that retuns the async PubSubClient
 */
export const usePubSubClient = () => {
  const { currentSpaceId = '' } = useSpaceEnvContext();
  const [pubSubClient, setPubSubClient] = useState<PubSubClient>({ on: noop, off: noop });

  useEffect(() => {
    const init = async () => {
      const client = await createPubSubClientForSpace(currentSpaceId);
      setPubSubClient(client as PubSubClient);
    };
    init();
  }, [currentSpaceId]);

  return pubSubClient;
};
