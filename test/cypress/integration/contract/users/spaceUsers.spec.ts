import { defaultRequestsMock } from '../../../util/factories';
import { defaultHeader, defaultSpaceId } from '../../../util/requests';
// import { defaultSpaceId } from '../../../util/requests';

const empty = require('../../../fixtures/responses/empty.json');

const loadPageWithServerState = () => {
  cy.setAuthTokenToLocalStorage();

  cy.resetAllFakeServers();

  const getSpaceMembersInteraction = 'query_space_members';
  const getSpaceMembershipsInteraction = 'query_space_memberships';
  const getRolesInteraction = 'query_space_roles';
  const getUsersInteraction = 'query_org_users';

  cy.addInteraction({
    provider: 'users',
    state: 'empty',
    uponReceiving: 'request for members in space',
    withRequest: {
      method: 'GET',
      path: `/spaces/${defaultSpaceId}/space_members`,
      query: { limit: '100', skip: '0' },
      headers: defaultHeader
    },
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as(getSpaceMembersInteraction);
  cy.addInteraction({
    provider: 'users',
    state: 'empty',
    uponReceiving: 'request for memberships in space',
    withRequest: {
      method: 'GET',
      path: `/spaces/${defaultSpaceId}/space_memberships`,
      query: { limit: '100', skip: '0' },
      headers: defaultHeader
    },
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as(getSpaceMembershipsInteraction);
  cy.addInteraction({
    provider: 'roles',
    state: 'empty',
    uponReceiving: 'request available roles of space',
    withRequest: {
      method: 'GET',
      path: `/spaces/${defaultSpaceId}/roles`,
      query: { limit: '100' },
      headers: defaultHeader
    },
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as(getRolesInteraction);
  cy.addInteraction({
    provider: 'users',
    state: 'empty',
    uponReceiving: 'request for users in space',
    withRequest: {
      method: 'GET',
      path: `/spaces/${defaultSpaceId}/users`,
      query: { limit: '100', skip: '0' },
      headers: defaultHeader
    },
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as(getUsersInteraction);

  const interactions = [
    ...defaultRequestsMock(),
    `@${getSpaceMembersInteraction}`,
    `@${getSpaceMembershipsInteraction}`,
    `@${getRolesInteraction}`,
    `@${getUsersInteraction}`
  ];

  cy.visit(`/spaces/${defaultSpaceId}/settings/users`);

  cy.wait(interactions);
};

describe('Users in space page', () => {
  before(() => {
    cy.startFakeServers({
      consumer: 'user_interface',
      providers: ['users', 'roles', 'product_catalog_features'],
      cors: true,
      pactfileWriteMode: 'merge',
      dir: Cypress.env('pactDir'),
      spec: 2
    });
  });

  describe('opening page with not users in space', () => {
    beforeEach(() => {
      loadPageWithServerState();
    });

    it('should render sidebar, but no user items', () => {
      cy.queryByTestId('cf-ui-workbench-sidebar-right').should('exist');
      cy.queryByTestId('user-list.item').should('not.exist');
    });
  });

  describe('inviting a user into a space', () => {
    it('send user invitation request and display user in list', () => {
      loadPageWithServerState();
    });
  });
});
