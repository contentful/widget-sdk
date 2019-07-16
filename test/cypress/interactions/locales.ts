import * as state from '../util/interactionState';
import { defaultHeader, defaultSpaceId } from '../util/requests';

const locales = require('../fixtures/responses/locales.json');

export const queryFirst100LocalesOfDefaultSpace = {
  willFindOne() {
    cy.addInteraction({
      provider: 'locales',
      state: state.Locales.ONLY_ENGLISH,
      uponReceiving: `a query for the first 100 locales of the "${defaultSpaceId}" space`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/locales`,
        headers: defaultHeader,
        query: {
          limit: '100',
          skip: '0'
        }
      },
      willRespondWith: {
        status: 200,
        body: locales
      }
    }).as(state.Locales.ONLY_ENGLISH);
  }
}
