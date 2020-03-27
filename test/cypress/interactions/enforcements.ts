import { defaultHeader, defaultSpaceId } from '../util/requests';

const empty = require('../fixtures/responses/empty.json');

enum States {
  NONE = 'enforcements/none',
}

export const getAllEnforcementsForDefaultSpace = {
  willReturnNone() {
    cy.addInteraction({
      provider: 'enforcements',
      state: States.NONE,
      uponReceiving: `a request to get all enforcements for "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/enforcements`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        body: empty,
      },
    }).as('getAllEnforcementsForDefaultSpace');

    return '@getAllEnforcementsForDefaultSpace';
  },
};
