const token = require('../fixtures/responses/token.json');

enum States {
  VALID = 'token/valid',
}

export const getTokenForUser = {
  willReturnAValidToken() {
    cy.addInteraction({
      provider: 'token',
      state: States.VALID,
      uponReceiving: 'a request to get a token from gatekeeper for the user',
      withRequest: {
        method: 'GET',
        path: '/token',
        headers: {
          Accept: 'application/json, text/plain, */*',
          Authorization:
            'Bearer CFAKE-140669ab83d2054794726a0372c87449841a876376f4de9369d856b098eda921',
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: token,
      },
    }).as('getTokenForUser');

    return '@getTokenForUser';
  },
};
