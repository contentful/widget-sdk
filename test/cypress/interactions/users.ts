import * as state from '../util/interactionState';
import {
  getSpaceUsers,
  getOrgUsers,
  defaultOrgId,
  defaultSpaceId,
  defaultUserId
} from '../util/requests';

const users = require('../fixtures/responses/users.json');

export function singleUser() {
  const query = {
    limit: '100',
    skip: '0'
  };
  cy.addInteraction({
    provider: 'users',
    state: state.Users.SINGLE,
    uponReceiving: 'a request for all space users',
    withRequest: getSpaceUsers(defaultSpaceId, query),
    willRespondWith: {
      status: 200,
      body: users
    }
  }).as(state.Users.SINGLE);
}

export function singleSpecificSpaceUserResponse() {
  const query = {
    limit: '1000',
    'sys.id[in]': defaultUserId    
  };
  cy.addInteraction({
    provider: 'users',
    state: state.Users.QUERY,
    uponReceiving: 'a request for a specific space user',
    withRequest: getSpaceUsers(defaultSpaceId, query),
    willRespondWith: {
      status: 200,
      body: users
    }
  }).as(state.Users.QUERY);
}

export function singleSpecificOrgUserResponse() {
  const query = {
    'sys.id[in]': defaultUserId
  };
  cy.addInteraction({
    provider: 'users',
    state: state.Users.SINGLE,
    uponReceiving: 'a request for a specific organization user',
    withRequest: getOrgUsers(defaultOrgId, query),
    willRespondWith: {
      status: 200,
      body: users
    }
  }).as(state.Users.SINGLE);
}
