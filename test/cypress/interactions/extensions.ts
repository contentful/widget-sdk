import * as state from '../util/interactionState';
import { defaultHeader, defaultSpaceId } from '../util/requests';

const empty = require('../fixtures/responses/empty.json');

export const getAllExtensionsInDefaultSpace = {
  willReturnNone() {
    return cy.addInteraction({
      provider: 'extensions',
      state: state.Extensions.NONE,
      uponReceiving: `a request to get all extensions in the space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/extensions`,
        headers: defaultHeader
      },
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as(state.Extensions.NONE);
  }
}
