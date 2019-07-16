import * as state from '../util/interactionState';

const token = require('../fixtures/responses/token.json');

export const getTokenForUser = {
  willReturnAValidToken() {
    cy.addInteraction({
      provider: 'token',
      state: state.Token.VALID,
      uponReceiving: 'a request to get a token for the user',
      withRequest: {
        method: 'GET',
        path: '/token',
        headers: {
          Accept: 'application/json, text/plain, */*'
        }
      },
      willRespondWith: {
        status: 200,
        body: token
      }
    }).as(state.Token.VALID);
  }
}
