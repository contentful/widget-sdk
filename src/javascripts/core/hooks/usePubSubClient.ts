import { useState, useEffect } from 'react';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { createPubSubClientForSpace, PubSubClient } from 'services/PubSubService';
import noop from 'lodash/noop';

/**
 * A React hook that retuns the async PubSubClient
 */
export const usePubSubClient = () => {
  const { currentSpaceId = '' } = useSpaceEnvContext();
  const [pubSubClient, setPubSubClient] = useState<PubSubClient | undefined>();

  useEffect(() => {
    const init = async () => {
      try {
        const client = await createPubSubClientForSpace(currentSpaceId);
        setPubSubClient(client as PubSubClient);
      } catch (error) {
        setPubSubClient({ on: noop, off: noop });
      }
    };
    init();
  }, [currentSpaceId]);

  return pubSubClient;
};
