import * as state from '../util/interactionState';
import { defaultSpaceId, defaultHeader } from '../util/requests';

// TODO: Only one environment in environments.json? Looks weird
const environments = require('../fixtures/responses/environments.json');

export const queryFirst101EnvironmentsInDefaultSpace = {
  willFindOne() {
    return cy.addInteraction({
      provider: 'environments',
      state: state.Environments.MASTER,
      uponReceiving: `a query for the first 101 environments in the space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments`,
        headers: defaultHeader,
        query: {
          limit: '101'
        }
      },
      willRespondWith: {
        status: 200,
        body: environments
      }
    }).as(state.Environments.MASTER);
  }
}
