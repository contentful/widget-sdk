import * as state from '../util/interactionState';
import { defaultSpaceId, defaultEnvironmentId } from '../util/requests';

const resourcesWithLimitsReached = require('../fixtures/responses/resources-with-limits-reached.json');

export const getResourcesWithLimistReached = {
  willReturnSeveral() {
    cy.addInteraction({
      provider: 'resources',
      state: state.Resources.SEVERAL_WITH_LIMITS_REACHED,
      uponReceiving: `a request to get resources with limits reached environment "${defaultEnvironmentId}" of space "${defaultSpaceId}"`,
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
}
