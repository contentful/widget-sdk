import * as state from '../util/interactionState';
import {
  defaultHeader,
  defaultSpaceId,
  defaultUserId
} from '../util/requests';
import { Query, RequestOptions } from '@pact-foundation/pact-web';

const users = require('../fixtures/responses/users.json');

function querySpaceUsersRequest(query: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${defaultSpaceId}/users`,
    headers: defaultHeader,
    query
  };
}

export const queryFirst100UsersInDefaultSpace = {
  willFindSeveral() {
    return cy.addInteraction({
      provider: 'users',
      state: state.Users.SINGLE,
      uponReceiving: `a query for the first 100 users in space "${defaultSpaceId}"`,
      withRequest: querySpaceUsersRequest({
        limit: '100',
        skip: '0'
      }),
      willRespondWith: {
        status: 200,
        body: users
      }
    }).as(state.Users.SINGLE);
  }
}

export const queryForDefaultUserDetails = {
  willFindTheUserDetails() {
    return cy.addInteraction({
      provider: 'users',
      // TODO: This is bad test design, we should have several users to check that we can ge specific user from several
      state: state.Users.SINGLE,
      uponReceiving: `a query for the details of user "${defaultUserId}" in space "${defaultSpaceId}"`,
      withRequest: querySpaceUsersRequest({
        limit: '1000', // TODO: Why ask for 1000 if we want only one?
        'sys.id[in]': defaultUserId
      }),
      willRespondWith: {
        status: 200,
        body: users // TODO: this looks like a bug, there are two users here!
      }
    }).as(state.Users.SINGLE);
  }
}
