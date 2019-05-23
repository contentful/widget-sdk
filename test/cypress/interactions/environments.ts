import * as state from '../util/interactionState';
import { getEnvironments, defaultSpaceId } from '../util/requests';

const environments = require('../fixtures/environments.json');
const query = { limit: '101' };

export function masterEnvironmentResponse() {
  cy.addInteraction({
    provider: 'environments',
    state: state.Environments.MASTER,
    uponReceiving: 'a request for all environments',
    withRequest: getEnvironments(defaultSpaceId, query),
    willRespondWith: {
      status: 200,
      body: environments
    }
  }).as(state.Environments.MASTER);
}
