import * as state from './interactionState';
import { HTTPMethod } from '@pact-foundation/pact/common/request';

const token = require('../fixtures/token.json');

export function validTokenResponse() {
  cy.addInteraction({
    state: state.Token.VALID,
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
  }).as(state.Token.VALID);
}
