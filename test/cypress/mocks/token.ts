import { HTTPMethod } from '@pact-foundation/pact/common/request';

const token = require('../fixtures/token.json');

export const tokenRequestAlias = 'token';

export function validTokenResponse() {
  cy.addInteraction({
    state: 'validToken',
    uponReceiving: 'a request for valid token',
    withRequest: {
      method: 'GET' as HTTPMethod,
      path: '/token',
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    },
    willRespondWith: {
      status: 200,
      body: token
    }
  }).as(tokenRequestAlias);
}
