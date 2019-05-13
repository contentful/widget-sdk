import * as state from '../util/interactionState';
import { defaultSpaceId } from '../util/requests';

const empty = require('../fixtures/empty.json');

export function emptyResourcesResponse() {
  cy.addInteraction({
    provider: 'resources',
    state: 'resources',
    uponReceiving: 'a request for all resources',
    withRequest: {
      method: 'GET',
      path: `/spaces/${defaultSpaceId}/environments/master/resources`,
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    },
    willRespondWith: {
      status: 200,
      body: empty 
    }
  }).as(state.Resources.NONE);
}
