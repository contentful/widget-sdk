import * as state from '../util/interactionState';
import { getEnvironments } from '../util/requests';

const environments = require('../fixtures/environments.json');

export function masterEnvironmentResponse() {
  cy.addInteraction({
    state: state.Environments.MASTER,
    uponReceiving: 'a request for all environments',
    withRequest: getEnvironments(),
    willRespondWith: {
      status: 200,
      body: environments
    }
  }).as(state.Environments.MASTER);
}
