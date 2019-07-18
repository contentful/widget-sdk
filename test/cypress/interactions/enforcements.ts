import { defaultHeader, defaultSpaceId } from '../util/requests';
import * as state from '../util/interactionState';

const empty = require('../fixtures/responses/empty.json');

export const getAllEnforcementsForDefaultSpace = {
  willReturnNone() {
    return cy.addInteraction({
      provider: 'enforcements',
      state: state.Enforcements.NONE,
      uponReceiving: `a request to get all enforcements for "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/enforcements`,
        headers: defaultHeader
      },
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as(state.Enforcements.NONE);
  }
};
