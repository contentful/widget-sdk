import { defaultRequestsMock } from '../../../util/factories';
import { defaultHeader, defaultSpaceId, defaultOrgId } from '../../../util/requests';

const empty = require('../../../fixtures/responses/empty.json');

const membership1 = {
  admin: true,
  roles: [],
  sys: {
    type: 'TeamSpaceMembership',
    id: 'TSM1',
    team: {
      sys: {
        type: 'Link',
        linkType: 'Team',
        id: 'team1',
      },
    },
  },
};
const role1 = {
  name: 'Role 1',
  sys: { id: 'role1' },
};
const linkRole1 = {
  sys: { type: 'Link', linkType: 'Role', id: 'role1' },
};

const loadPageWithServerState = (stateName, responseBody, message) => {
  cy.setAuthTokenToLocalStorage();

  cy.resetAllFakeServers();

  const getMembershipsInteraction = 'query_team_space_memberships';
  const getSpaceMembershipsInteraction = 'query_space_memberships';
  const getRolesInteraction = 'query_space_roles';
  const getTeamsInteraction = 'query_teams_in_org';

  // TODO: Move this to interactions/teams
  cy.addInteraction({
    provider: 'teams',
    state: stateName,
    uponReceiving: message,
    withRequest: {
      method: 'GET',
      path: `/spaces/${defaultSpaceId}/team_space_memberships`,
      query: { include: 'roles,sys.team', limit: '100', skip: '0' },
      headers: defaultHeader,
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.contentful.management.v1+json',
      },
      body: responseBody,
    },
  }).as(getMembershipsInteraction);
  cy.addInteraction({
    provider: 'teams',
    state: 'no-space-memberships',
    uponReceiving: 'request for memberships in space',
    withRequest: {
      method: 'GET',
      path: `/spaces/${defaultSpaceId}/space_memberships`,
      query: { limit: '100', skip: '0' },
      headers: defaultHeader,
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.contentful.management.v1+json',
      },
      body: empty,
    },
  }).as(getSpaceMembershipsInteraction);
  // TODO: Move this to interactions/teams
  cy.addInteraction({
    provider: 'teams',
    state: 'no-teams',
    uponReceiving: 'request for teams in org',
    withRequest: {
      method: 'GET',
      path: `/organizations/${defaultOrgId}/teams`,
      query: { limit: '100', skip: '0' },
      headers: defaultHeader,
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.contentful.management.v1+json',
      },
      body: empty,
    },
  }).as(getTeamsInteraction);
  // TODO: Move this to interactions/teams
  cy.addInteraction({
    provider: 'roles',
    state: 'default',
    uponReceiving: 'request available roles of space',
    withRequest: {
      method: 'GET',
      path: `/spaces/${defaultSpaceId}/roles`,
      query: { limit: '100', skip: '0' },
      headers: defaultHeader,
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.contentful.management.v1+json',
      },
      body: {
        items: [
          role1,
          {
            name: 'Role 2',
            sys: { id: 'role2' },
          },
          {
            name: 'Role 3',
            sys: { id: 'role3' },
          },
          {
            name: 'Role 4',
            sys: { id: 'role4' },
          },
          {
            name: 'Role 5',
            sys: { id: 'role5' },
          },
        ],
      },
    },
  }).as(getRolesInteraction);

  const interactions = [
    ...defaultRequestsMock(),
    `@${getMembershipsInteraction}`,
    `@${getTeamsInteraction}`,
    `@${getRolesInteraction}`,
    `@${getSpaceMembershipsInteraction}`,
  ];

  cy.visit(`/spaces/${defaultSpaceId}/settings/teams`);

  cy.wait(interactions);
};

describe('Teams in space page', () => {
  before(() => {
    cy.startFakeServers({
      consumer: 'user_interface',
      providers: ['teams', 'roles', 'product_catalog_features'],
      cors: true,
      pactfileWriteMode: 'merge',
      dir: Cypress.env('pactDir'),
      spec: 2,
    });
  });

  context('opening the page with no teams in the space', () => {
    beforeEach(() => {
      loadPageWithServerState('empty', empty, 'request for empty member list');
    });

    it('renders empty placeholder', () => {
      cy.findByTestId('no-teams-in-space-placeholder').should('be.visible');
    });
  });

  context('opening the page with teams in the space', () => {
    beforeEach(() => {
      loadPageWithServerState(
        '3_memberships',
        {
          total: 3,
          sys: {
            type: 'Array',
          },
          includes: {
            Team: [
              {
                name: 'Team 1',
                sys: { id: 'team1', memberCount: 2 },
              },
              {
                name: 'Team 2',
                sys: { id: 'team2', memberCount: 0 },
              },
              {
                name: 'Team 3',
                sys: { id: 'team3', memberCount: 1 },
              },
            ],
            Role: [
              role1,
              {
                name: 'Role 2',
                sys: { id: 'role2' },
              },
              {
                name: 'Role 3',
                sys: { id: 'role3' },
              },
            ],
          },
          items: [
            membership1,
            {
              admin: false,
              roles: [linkRole1],
              sys: {
                type: 'TeamSpaceMembership',
                id: 'TSM2',
                team: {
                  sys: {
                    type: 'Link',
                    linkType: 'Team',
                    id: 'team2',
                  },
                },
              },
            },
            {
              admin: false,
              roles: [
                {
                  sys: {
                    type: 'Link',
                    linkType: 'Role',
                    id: 'role2',
                  },
                },
                {
                  sys: {
                    type: 'Link',
                    linkType: 'Role',
                    id: 'role3',
                  },
                },
              ],
              sys: {
                type: 'TeamSpaceMembership',
                id: 'TSM3',
                version: 0,
                team: {
                  sys: {
                    type: 'Link',
                    linkType: 'Team',
                    id: 'team3',
                  },
                },
              },
            },
          ],
        },
        'request for 3 team memberships'
      );
    });

    it('renders the table with 3 teams', () => {
      cy.findByTestId('membership-table').should('be.visible');

      cy.findAllByTestId('membership-row').should('have.length', 3);
      cy.findAllByTestId('membership-row').then((rows) => {
        cy.wrap(rows[0]).should('be.visible');
        cy.wrap(rows[0]).contains('td', '2 members').should('be.visible');
        cy.wrap(rows[0]).contains('td', 'Team 1').should('be.visible');
        cy.wrap(rows[0]).contains('td', 'Admin').should('be.visible');

        cy.wrap(rows[1]).should('be.visible');
        cy.wrap(rows[1]).contains('td', '0 members').should('be.visible');
        cy.wrap(rows[1]).contains('td', 'Team 2').should('be.visible');
        cy.wrap(rows[1]).contains('td', 'Role 1').should('be.visible');

        cy.wrap(rows[2]).should('be.visible');
        cy.wrap(rows[2]).contains('td', '1 member').should('be.visible');
        cy.wrap(rows[2]).contains('td', 'Team 3').should('be.visible');
        cy.wrap(rows[2]).contains('td', 'Role 2 and Role 3').should('be.visible');
      });
    });

    context('changing role of Team 1', () => {
      beforeEach(() => {
        const editmembershipInteraction = 'editMembership';
        // TODO: Move this to interactions/team
        cy.addInteraction({
          provider: 'teams',
          state: 'initial roles',
          uponReceiving: 'change role of team',
          withRequest: {
            method: 'PUT',
            path: `/spaces/${defaultSpaceId}/team_space_memberships/TSM1`,
            headers: {
              ...defaultHeader,
              'CONTENT-TYPE': 'application/vnd.contentful.management.v1+json',
              'x-contentful-team': 'team1',
            },
            body: {
              admin: false,
              roles: [linkRole1],
            },
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Content-Type': 'application/vnd.contentful.management.v1+json',
            },
            body: {
              ...membership1,
              sys: { version: 1, ...membership1.sys },
              admin: false,
              roles: [linkRole1],
            },
          },
        }).as(editmembershipInteraction);

        cy.findAllByTestId('row-menu').first().click();
        cy.findByTestId('change-role').click();
        cy.findByTestId('space-role-editor.button').click();
        cy.findAllByTestId('space-role-editor.role-option').first().click();
        cy.findByTestId('confirm-change-role').click();

        cy.wait(`@${editmembershipInteraction}`);
      });

      it('should have changed role', () => {
        cy.findAllByTestId('membership-row').first().as('firstRow');
        cy.get('@firstRow').contains('td', 'Role 1').should('be.visible');
        cy.get('@firstRow').contains('td', 'Team 1').should('be.visible');
      });
    });

    context('remove team from space', () => {
      beforeEach(() => {
        const removeTeamInteraction = 'removeTeam';
        cy.addInteraction({
          provider: 'teams',
          state: 'initial teams',
          uponReceiving: 'remove team from space',
          withRequest: {
            method: 'DELETE',
            path: `/spaces/${defaultSpaceId}/team_space_memberships/TSM1`,
            headers: defaultHeader,
          },
          willRespondWith: {
            status: 204,
            headers: {
              'Content-Type': 'application/vnd.contentful.management.v1+json',
            },
          },
        }).as(removeTeamInteraction);

        cy.findAllByTestId('row-menu').first().click();
        cy.findByTestId('remove-team').click();
        cy.findByTestId('cf-ui-modal-confirm-confirm-button').click();

        cy.wait(`@${removeTeamInteraction}`);
      });

      it('should have removed team from space', () => {
        cy.findAllByTestId('membership-row').first().as('firstRow');
        cy.get('@firstRow').contains('td', 'Team 1').should('not.exist');
      });
    });
  });
});
