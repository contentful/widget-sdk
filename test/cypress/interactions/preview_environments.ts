import { defaultHeader, defaultSpaceId } from '../util/requests';

const empty = require('../fixtures/responses/empty.json');

enum States {
  NONE = 'preview_environments/none',
}

export const queryFirst100PreviewEnvironments = {
  willFindNone() {
    cy.addInteraction({
      provider: 'preview_environments',
      state: States.NONE,
      uponReceiving: `a query for the first 100 preview environments in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/preview_environments`,
        headers: defaultHeader,
        query: {
          limit: '100',
        },
      },
      willRespondWith: {
        status: 200,
        body: empty,
      },
    }).as('queryFirst100PreviewEnvironments');

    return '@queryFirst100PreviewEnvironments';
  },
};
