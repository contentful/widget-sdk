import { getEnforcements } from '../util/requests';
import * as state from '../util/interactionState';

const empty = require('../fixtures/responses/empty.json');

export function noEnforcementsResponse() {
  return cy
    .addInteraction({
      provider: 'enforcements',
      state: state.Enforcements.NONE,
      uponReceiving: 'a request for all enforcements',
      withRequest: getEnforcements(),
      willRespondWith: {
        status: 200,
        body: empty
      }
    })
    .as(state.Enforcements.NONE);
}
