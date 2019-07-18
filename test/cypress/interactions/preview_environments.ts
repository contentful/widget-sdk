import * as state from '../util/interactionState';
import { defaultHeader, defaultSpaceId } from '../util/requests';

const empty = require('../fixtures/responses/empty.json');

export const queryFirst100PreviewEnvironments = {
  willFindNone() {
    return cy.addInteraction({
      provider: 'preview_environments',
      state: state.PreviewEnvironments.NONE,
      uponReceiving: `a query for the first 100 preview environments in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/preview_environments`,
        headers: defaultHeader,
        query: {
          limit: '100'
        }
      },
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as(state.PreviewEnvironments.NONE);
  }
}
