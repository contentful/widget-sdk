const token = require('../fixtures/responses/token.json');

enum States {
  VALID = 'token/valid',
}

export const getTokenForUser = {
  willReturnAValidToken() {
    cy.addInteraction({
      provider: 'token',
      state: States.VALID,
      uponReceiving: 'a request to get a token for the user',
      withRequest: {
        method: 'GET',
        path: '/token',
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
      },
      willRespondWith: {
        status: 200,
        body: token,
      },
    }).as('getTokenForUser');

    return '@getTokenForUser';
  },
};
