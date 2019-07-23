import { defaultHeader, defaultSpaceId } from '../util/requests';

const locales = require('../fixtures/responses/locales.json');

enum States {
  ONLY_ENGLISH = 'locales/only-english'
}

export const queryFirst100LocalesOfDefaultSpace = {
  willFindOne() {
    cy.addInteraction({
      provider: 'locales',
      state: States.ONLY_ENGLISH,
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
    }).as('queryFirst100LocalesOfDefaultSpace');

    return '@queryFirst100LocalesOfDefaultSpace'
  }
}
