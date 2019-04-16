import * as state from './interactionState';

const users = require('../fixtures/users.json');
const spaceId = Cypress.env('spaceId');

export function singleUser() {
  cy.addInteraction({
    state: state.Users.SINGLE,
    uponReceiving: 'a request for all users',
    withRequest: {
      method: 'GET',
      path: `/spaces/${spaceId}/users`,
      headers: {
        Accept: 'application/json, text/plain, */*'
      },
      query: 'limit=100&skip=0'
    },
    willRespondWith: {
      status: 200,
      body: users
    }
  }).as(state.Users.SINGLE);
}
