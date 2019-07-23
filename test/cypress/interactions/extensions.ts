import { defaultHeader, defaultSpaceId } from '../util/requests';

const empty = require('../fixtures/responses/empty.json');

enum States {
  NONE = 'extensions/none'
}

export const getAllExtensionsInDefaultSpace = {
  willReturnNone() {
    cy.addInteraction({
      provider: 'extensions',
      state: States.NONE,
      uponReceiving: `a request to get all extensions in the space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/extensions`,
        headers: defaultHeader,
        query: {
          limit: '1000',
          stripSrcdoc: 'true',
        }
      },
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('getAllExtensionsInDefaultSpace');

    return '@getAllExtensionsInDefaultSpace';
  }
}
