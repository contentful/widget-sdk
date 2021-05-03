import { startMockServer } from '@contentful/pact-node-utils';
import { defaultSpaceId, defaultEnvironmentId } from '../../../../cypress/util/requests';
import { noop } from 'lodash';
import { createEntityRepo } from '@contentful/editorial-primitives';
import { createPubSubClientForSpace } from '../../../../../src/javascripts/__mocks__/services/PubSubService';
import constants from '../../../../constants';
import fetch from 'node-fetch';
import { createClient } from 'contentful-management';
import { requestLogger } from '../../../../../src/javascripts/core/services/usePlainCMAClient/plainClientLogger';

// TODO: This is a hack to ensure the underlying window.fetch is actually called.
global.fetch = fetch;

export const getServerAndClient = async () => {
  const server = await startMockServer({
    host: 'localhost',
    port: 12345,
    consumer: 'user_interface',
  });

  const entityRepo = createEntityRepo({
    cmaClient: createClient(
      {
        baseURL: 'http://' + server.host + ':' + server.port,
        host: 'http://' + server.host + ':' + server.port,
        accessToken: constants.token,
        requestLogger,
      },
      {
        type: 'plain',
        defaults: {
          spaceId: defaultSpaceId,
          environmentId: defaultEnvironmentId,
        },
      }
    ),
    //@ts-expect-error
    environment: { sys: { id: defaultEnvironmentId } },
    pubSubClient: createPubSubClientForSpace(),
    triggerCmaAutoSave: noop,
  });

  return { server, entityRepo };
};
