import * as state from '../util/interactionState';
import { getUsers, defaultSpaceId } from '../util/requests';

const users = require('../fixtures/users.json');

export function singleUser() {
  const query = {
    limit: '100',
    skip: '0'
  };
  cy.addInteraction({
    provider: 'users',
    state: state.Users.SINGLE,
    uponReceiving: 'a request for all users',
    withRequest: getUsers(defaultSpaceId, query),
    willRespondWith: {
      status: 200,
      body: users
    }
  }).as(state.Users.SINGLE);
}
