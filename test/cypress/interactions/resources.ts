import * as state from '../util/interactionState';
import { defaultSpaceId, defaultEnvironment } from '../util/requests';

const empty = require('../fixtures/responses/empty.json');
const resources = require('../fixtures/responses/resources.json');

export function emptyResourcesResponse() {
  cy.addInteraction({
    provider: 'resources',
    state: 'resources',
    uponReceiving: 'a request for empty resources',
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

export function defaultResourcesResponse() {
  cy.addInteraction({
    provider: 'resources',
    state: 'resources',
    uponReceiving: 'a request for all resources',
    withRequest: {
      method: 'GET',
      path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironment}/resources`,
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    },
    willRespondWith: {
      status: 200,
      body: resources
    }
  }).as(state.Resources.DEFAULT);
}
