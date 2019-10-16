import { defaultRequestsMock } from '../../../util/factories';
import { defaultHeader, defaultSpaceId, defaultOrgId } from '../../../util/requests';

const empty = require('../../../fixtures/responses/empty.json');

const twoMembersBody = {
  total: 2,
  sys: {
    type: 'Array'
  },
  items: [
    {
      admin: true,
      roles: [],
      relatedMemberships: [
        {
          sys: {
            type: 'Link',
            linkType: 'SpaceMembership',
            id: 'space_membership_1'
          }
        }
      ],
      sys: {
        type: 'SpaceMember',
        id: 'space_member_1',
        space: {
          type: 'Link',
          linkType: 'Space',
          id: defaultSpaceId
        },
        user: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: 'user1'
          }
        }
      }
    },
    {
      admin: false,
      roles: [
        {
          sys: {
            type: 'Link',
            linkType: 'Role',
            id: 'role1'
          }
        },
        {
          sys: {
            type: 'Link',
            linkType: 'Role',
            id: 'role2'
          }
        }
      ],
      relatedMemberships: [
        {
          sys: {
            type: 'Link',
            linkType: 'SpaceMembership',
            id: 'space_membership_2'
          }
        },
        {
          sys: {
            type: 'Link',
            linkType: 'TeamSpaceMembership',
            id: 'team_space_membership_1'
          }
        }
      ],
      sys: {
        type: 'SpaceMember',
        id: 'space_member_2',
        space: {
          type: 'Link',
          linkType: 'Space',
          id: defaultSpaceId
        },
        user: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: 'user2'
          }
        }
      }
    }
  ]
};

const getOrgUsersInteraction = 'query_org_users';
const postSpaceMembership = 'post_space_membership';

const spaceUsers = [
  {
    email: 'user1@mail.com',
    firstName: 'One',
    lastName: 'Eins',
    sys: { id: 'user1' }
  },
  {
    email: 'user2@mail.com',
    firstName: 'Two',
    lastName: 'Zwei',
    sys: { id: 'user2' }
  }
];

const user3 = {
  email: 'user3@mail.com',
  firstName: 'Three',
  lastName: 'Drei',
  sys: { id: 'user3' }
};

const roles = [
  {
    name: 'Role 1',
    sys: {
      id: 'role1'
    }
  },
  {
    name: 'Role 2',
    sys: {
      id: 'role2'
    }
  }
];

const spaceMemberships = [
  {
    sys: {
      id: 'space_membership_1',
      type: 'SpaceMembership',
      version: 0
    }
  },
  {
    sys: {
      id: 'space_membership_2',
      type: 'SpaceMembership',
      version: 0
    }
  }
];

const orgUsers = [
  ...spaceUsers,
  user3
];

const loadPageWithUserState = ({ stateName, responseBody, message }) => {
  cy.setAuthTokenToLocalStorage();

  cy.resetAllFakeServers();

  const getSpaceMembersInteraction = 'query_space_members';
  const getSpaceMembershipsInteraction = 'query_space_memberships';
  const getRolesInteraction = 'query_space_roles';
  const getSpaceUsersInteraction = 'query_space_users';

  cy.addInteraction({
    provider: 'users',
    state: stateName,
    uponReceiving: message,
    withRequest: {
      method: 'GET',
      path: `/spaces/${defaultSpaceId}/space_members`,
      query: { limit: '100', skip: '0' },
      headers: defaultHeader
    },
    willRespondWith: {
      status: 200,
      body: responseBody
    }
  }).as(getSpaceMembersInteraction);
  cy.addInteraction({
    provider: 'users',
    state: '2_membership',
    uponReceiving: 'request space memberships',
    withRequest: {
      method: 'GET',
      path: `/spaces/${defaultSpaceId}/space_memberships`,
      query: { limit: '100', skip: '0' },
      headers: defaultHeader
    },
    willRespondWith: {
      status: 200,
      body: {
        total: 2,
        sys: {
          type: 'Array'
        },
        items: spaceMemberships
      }
    }
  }).as(getSpaceMembershipsInteraction);
  cy.addInteraction({
    provider: 'roles',
    state: '2_roles',
    uponReceiving: 'request available roles of space',
    withRequest: {
      method: 'GET',
      path: `/spaces/${defaultSpaceId}/roles`,
      query: { limit: '100' },
      headers: defaultHeader
    },
    willRespondWith: {
      status: 200,
      body: {
        total: 2,
        sys: {
          type: 'Array'
        },
        items: roles
      }
    }
  }).as(getRolesInteraction);
  cy.addInteraction({
    provider: 'users',
    state: '2_users',
    uponReceiving: 'request for users in space',
    withRequest: {
      method: 'GET',
      path: `/spaces/${defaultSpaceId}/users`,
      query: { limit: '100', skip: '0' },
      headers: defaultHeader
    },
    willRespondWith: {
      status: 200,
      body: {
        total: spaceUsers.length,
        sys: {
          type: 'Array'
        },
        items: spaceUsers
      }
    }
  }).as(getSpaceUsersInteraction);

  const interactions = [
    ...defaultRequestsMock(),
    `@${getSpaceMembersInteraction}`,
    `@${getSpaceMembershipsInteraction}`,
    `@${getRolesInteraction}`,
    `@${getSpaceUsersInteraction}`
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

  describe('opening page with no users in space', () => {
    beforeEach(() => {
      loadPageWithUserState({
        stateName: 'empty',
        message: 'request for members in space',
        responseBody: empty
      });
    });

    it('should render sidebar, but no user items', () => {
      cy.queryByTestId('cf-ui-workbench-sidebar-right').should('exist');
      cy.queryByTestId('user-list.item').should('not.exist');
    });

    it('should make post request when adding user to space', () => {
      cy.addInteraction({
        provider: 'users',
        state: '3_users',
        uponReceiving: 'request for users in org',
        withRequest: {
          method: 'GET',
          path: `/organizations/${defaultOrgId}/users`,
          query: { limit: '100', order: '-sys.updatedAt', skip: '0', 'sys.archivedAt[exists]': 'false' },
          headers: defaultHeader
        },
        willRespondWith: {
          status: 200,
          body: {
            total: orgUsers.length,
            sys: {
              type: 'Array'
            },
            items: orgUsers
          }
        }
      }).as(getOrgUsersInteraction);
      cy.addInteraction({
        provider: 'users',
        state: 'default',
        uponReceiving: 'adding space membership',
        withRequest: {
          method: 'POST',
          path: `/spaces/${defaultSpaceId}/space_memberships`,
          headers: defaultHeader,
          body: {
            admin: false,
            email: user3.email,
            roles: [
              {
                type: 'Link',
                linkType: 'Role',
                id: 'role1'
              }
            ]
          }
        },
        willRespondWith: {
          status: 201,
          body: {
            admin: true,
            roles: [],
            sys: {
              id: 'space_membership_3'
            },
            user: user3
          }
        }
      }).as(postSpaceMembership);

      cy.getByTestId('add-users-to-space').click();
      cy.wait(`@${getOrgUsersInteraction}`);
      cy.getByTestId('entity-selector-item').first().click();
      cy.getByTestId('entity-selector-confirm').click();
      cy.getByTestId('user-role-select').first().select('role1');
      cy.getByTestId('user-space-invitation-confirm').click();
      cy.wait(`@${postSpaceMembership}`);
    });
  });

  describe('opening page with two users in space', () => {
    beforeEach(() => {
      loadPageWithUserState({
        stateName: '2_members',
        message: 'request for members in space',
        responseBody: twoMembersBody
      });
    });

    it('should render sidebar and user items', () => {
      cy.queryByTestId('cf-ui-workbench-sidebar-right').should('exist');
      cy.queryByTestId('user-list.item').should('exist');
    });

    it('should make put request when changing role', () => {
      cy.getByTestId('user-list.actions').first().click();
      cy.getByTestId('user-change-role').click();
      cy.getByTestId('RoleSelector.admin_false').click();
      cy.getByTestId('cf-ui-checkbox-field').click();

      const putRoleUpdate = 'put_role_update';
      const roleLink = {
        type: 'Link',
        linkType: 'Role',
        id: roles[0].sys.id
      };
      cy.addInteraction({
        provider: 'users',
        state: 'default',
        uponReceiving: 'updating membership role',
        withRequest: {
          method: 'PUT',
          path: `/spaces/${defaultSpaceId}/space_memberships/${spaceMemberships[0].sys.id}`,
          headers: defaultHeader,
          body: {
            admin: false,
            roles: [roleLink]
          }
        },
        willRespondWith: {
          status: 200,
          body: {
            admin: false,
            roles: [roleLink],
            sys: {
              id: roleLink.id,
              version: 1
            }
          }
        }
      }).as(putRoleUpdate);

      cy.getByTestId('cf-ui-modal-confirm-confirm-button').click();

      cy.wait(`@${putRoleUpdate}`);
    });
  });
});
