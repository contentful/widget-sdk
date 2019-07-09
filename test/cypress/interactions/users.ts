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
    // TODO: What happens if we have several users? This does not look ok
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
    // TODO: This is bad test design, we should have several users to check that we can ge specific user from several
    state: state.Users.SINGLE,
    uponReceiving: 'a request for a specific space user',
    withRequest: getSpaceUsers(defaultSpaceId, query),
    willRespondWith: {
      status: 200,
      body: users
    }
  }).as(state.Users.SINGLE);
}

export function singleSpecificOrgUserResponse() {
  const query = {
    'sys.id[in]': defaultUserId
  };
  cy.addInteraction({
    provider: 'users',
    // TODO: This is bad test design, we should have several users to check that we can ge specific user from several
    state: state.Users.SINGLE,
    uponReceiving: 'a request for a specific organization user',
    withRequest: getOrgUsers(defaultOrgId, query),
    willRespondWith: {
      status: 200,
      body: users
    }
  }).as(state.Users.SINGLE);
}
