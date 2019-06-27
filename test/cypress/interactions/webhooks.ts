import * as state from '../util/interactionState';
import { getWebhooks, defaultSpaceId } from '../util/requests';

const empty = require('../fixtures/responses/empty.json');
const query = {
  limit: '100'
};

export function noWebhooksResponse() {
  return cy
    .addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.NONE,
      uponReceiving: 'a request for all webhooks',
      withRequest: getWebhooks(defaultSpaceId, query),
      willRespondWith: {
        status: 200,
        body: empty
      }
    })
    .as(state.Webhooks.NONE);
}

export function webhooksErrorResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: 'noWebhooksError',
    uponReceiving: 'a request for all webhooks',
    withRequest: getWebhooks(defaultSpaceId, query),
    willRespondWith: {
      status: 500,
      body: empty
    }
  }).as(state.Webhooks.ERROR);
}
