import { defaultHeader, defaultSpaceId, defaultUserId, defaultOrgId } from '../util/requests';
import { Query, RequestOptions } from '@pact-foundation/pact-web';

const users = require('../fixtures/responses/users.json');
const userResponse = require('../fixtures/responses/user.json');

const getUsersInteraction = 'query_users';

enum States {
  SINGLE = 'users/single',
  MULTIPLE = 'users/multiple',
}

function querySpaceUsersRequest(query: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${defaultSpaceId}/users`,
    headers: defaultHeader,
    query,
  };
}

export const queryFirst100UsersInDefaultSpace = {
  willFindSeveral() {
    cy.addInteraction({
      provider: 'users',
      state: States.SINGLE,
      uponReceiving: `a query for the first 100 users in space "${defaultSpaceId}"`,
      withRequest: querySpaceUsersRequest({
        limit: '100',
        skip: '0',
      }),
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: users,
      },
    }).as('queryFirst100UsersInDefaultSpace');

    return '@queryFirst100UsersInDefaultSpace';
  },
};

export const queryForDefaultUserDetails = {
  willFindTheUserDetails() {
    cy.addInteraction({
      provider: 'users',
      // TODO: This is bad test design, we should have several users to check that we can ge specific user from several
      state: States.SINGLE,
      uponReceiving: `a query for the details of user "${defaultUserId}" in space "${defaultSpaceId}"`,
      withRequest: querySpaceUsersRequest({
        limit: '1000', // TODO: Why ask for 1000 if we want only one?
        'sys.id[in]': defaultUserId,
      }),
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: users, // TODO: this looks like a bug, there are two users here!
      },
    }).as('queryForDefaultUserDetails');

    return '@queryForDefaultUserDetails';
  },
};

export const queryForUsers = {
  willFindTheUserDetails() {
    cy.addInteraction({
      provider: 'users',
      state: States.MULTIPLE,
      uponReceiving: `a query for the details of users in space "${defaultSpaceId}"`,
      withRequest: querySpaceUsersRequest({
        limit: '100',
        skip: '0',
      }),
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: users,
      },
    }).as('queryForUsers');

    return '@queryForUsers';
  },
};

export const getUsers = {
  willReturnSingle() {
    cy.addInteraction({
      provider: 'organization_usage',
      state: 'single user',
      uponReceiving: `a request to get the default user details`,
      withRequest: {
        method: 'GET',
        path: `/organizations/${defaultOrgId}/users`,
        query: { 'sys.id': defaultUserId },
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: userResponse,
      },
    }).as(getUsersInteraction);

    return `@${getUsersInteraction}`;
  },
};
