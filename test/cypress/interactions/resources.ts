import * as state from '../util/interactionState';
import { defaultSpaceId, defaultEnvironmentId } from '../util/requests';

const resources = require('../fixtures/responses/resources.json');
const resourcesWithLimitsReached = require('../fixtures/responses/resources-with-limits-reached.json');

export function limitsReachedResourcesResponse() {
  cy.addInteraction({
    provider: 'resources',
    state: state.Resources.SEVERAL_WITH_LIMITS_REACHED,
    uponReceiving: 'a request for resources with limits reached',
    withRequest: {
      method: 'GET',
      path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/resources`,
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    },
    willRespondWith: {
      status: 200,
      body: resourcesWithLimitsReached
    }
  }).as(state.Resources.SEVERAL_WITH_LIMITS_REACHED);
}

export function defaultResourcesResponse() {
  cy.addInteraction({
    provider: 'resources',
    state: 'resources',
    uponReceiving: 'a request for all resources',
    withRequest: {
      method: 'GET',
      path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/resources`,
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    },
    willRespondWith: {
      status: 200,
      body: resources
    }
  }).as(state.Resources.SEVERAL);
}
