import { startMockServer } from '@contentful/pact-node-utils';
import { defaultSpaceId } from '../../../cypress/util/requests';
import { noop } from 'lodash';
import { createSpaceEndpoint } from '../../../../src/javascripts/data/Endpoint';
import { create as createEntityRepo } from '../../../../src/javascripts/data/CMA/EntityRepo';
import { createPubSubClientForSpace } from '../../../../src/javascripts/__mocks__/services/PubSubService';
import constants from '../../../constants';
import fetch from 'node-fetch';

// TODO: This is a hack to ensure the underlying window.fetch is actually called.
global.fetch = fetch;

export const getServerAndClient = async () => {
  const server = await startMockServer({
    host: 'localhost',
    port: 1234,
    consumer: 'user_interface',
  });

  const spaceEndpoint = createSpaceEndpoint(
    `http://${server.host}:${server.port}`,
    defaultSpaceId,
    {
      getToken: () => Promise.resolve(constants.token),
    }
  );
  const entityRepo = createEntityRepo(spaceEndpoint, createPubSubClientForSpace(), noop);

  return { server, entityRepo };
};
