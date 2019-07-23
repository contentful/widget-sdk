import { defaultRequestsMock } from '../../../util/factories';
import { defaultHeader, defaultSpaceId, defaultOrgId } from '../../../util/requests';

const empty = require('../../../fixtures/responses/empty.json');

const teamHeaders = {
  ...defaultHeader,
  'x-contentful-enable-alpha-feature': 'teams-api'
};

const loadPageWithServerState = (stateName, responseBody, message) => {
  cy.setAuthTokenToLocalStorage();

  cy.resetAllFakeServers();

  const getMembershipsInteraction = 'query_team_space_memberships';
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
      headers: teamHeaders
    },
    willRespondWith: {
      status: 200,
      body: responseBody
    }
  }).as(getMembershipsInteraction);
  // TODO: Move this to interactions/teams
  cy.addInteraction({
    provider: 'teams',
    state: 'no-teams',
    uponReceiving: 'request for teams in org',
    withRequest: {
      method: 'GET',
      path: `/organizations/${defaultOrgId}/teams`,
      query: { limit: '100', skip: '0' },
      headers: teamHeaders
    },
    willRespondWith: {
      status: 200,
      body: empty
    }
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
      headers: defaultHeader
    },
    willRespondWith: {
      status: 200,
      body: {
        items: [
          {
            name: 'Role 1',
            sys: { id: 'role1' }
          },
          {
            name: 'Role 2',
            sys: { id: 'role2' }
          },
          {
            name: 'Role 3',
            sys: { id: 'role3' }
          },
          {
            name: 'Role 4',
            sys: { id: 'role4' }
          }
          ,
          {
            name: 'Role 5',
            sys: { id: 'role5' }
          }

        ]
      }
    }
  }).as(getRolesInteraction);

  const interactions = [
    ...defaultRequestsMock(),
    `@${getMembershipsInteraction}`,
    `@${getTeamsInteraction}`,
    `@${getRolesInteraction}`
  ]

  cy.visit(`/spaces/${defaultSpaceId}/settings/teams`);

  cy.wait(interactions);
};

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
        id: 'team1'
      }
    }
  }
};
const role1 = {
  name: 'Role 1',
  sys: { id: 'role1' }
};

describe('Teams in space page', () => {
  before(() => {
    cy.startFakeServers({
      consumer: 'user_interface',
      providers: ['teams', 'roles', 'product_catalog_features'],
      cors: true,
      pactfileWriteMode: 'merge',
      spec: 2
    });
  });

  context('opening the page with no teams in the space', () => {
    beforeEach(() => {
      loadPageWithServerState('empty', empty, 'request for empty member list');
    });

    it('renders empty placeholder', () => {
      cy.getByTestId('no-teams-in-space-placeholder').should('be.visible');
    });
  });

  context('opening the page with teams in the space', () => {
    beforeEach(() => {
      loadPageWithServerState(
        '3_memberships',
        {
          total: 3,
          sys: {
            type: 'Array'
          },
          includes: {
            Team: [
              {
                name: 'Team 1',
                memberCount: 500,
                sys: { id: 'team1' }
              },
              {
                name: 'Team 2',
                memberCount: 0,
                sys: { id: 'team2' }
              },
              {
                name: 'Team 3',
                memberCount: 1,
                sys: { id: 'team3' }
              }
            ],
            Role: [
              role1,
              {
                name: 'Role 2',
                sys: { id: 'role2' }
              },
              {
                name: 'Role 3',
                sys: { id: 'role3' }
              }
            ]
          },
          items: [
            membership1,
            {
              admin: false,
              roles: [
                {
                  sys:
                  {
                    type: 'Link',
                    linkType: 'Role',
                    id: 'role1'
                  }
                }
              ],
              sys: {
                type: 'TeamSpaceMembership',
                id: 'TSM2',
                team: {
                  sys: {
                    type: 'Link',
                    linkType: 'Team',
                    id: 'team2'
                  }
                }
              }
            },
            {
              admin: false,
              roles: [
                {
                  sys:
                  {
                    type: 'Link',
                    linkType: 'Role',
                    id: 'role2'
                  }
                },
                {
                  sys:
                  {
                    type: 'Link',
                    linkType: 'Role',
                    id: 'role3'
                  }
                }
              ],
              sys: {
                type: 'TeamSpaceMembership',
                id: 'TSM3',
                version: 0,
                team: {
                  sys: {
                    type: 'Link',
                    linkType: 'Team',
                    id: 'team3'
                  }
                }
              }
            }
          ]
        },
        'request for 3 team memberships'
      );
    });

    it('renders the table with 3 teams', () => {
      cy.getByTestId('membership-table').should('be.visible');

      cy.getAllByTestId('membership-row').should('have.length', 3);
      cy.getAllByTestId('membership-row').then(
        (rows) => {
          cy.wrap(rows[0]).should('be.visible');
          cy.wrap(rows[0]).contains('td', '500 members').should('be.visible');
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
        }
      );
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
            headers: teamHeaders
          },
          willRespondWith: {
            status: 200,
            body: { ...membership1, sys: { version: 1, ...membership1.sys }, admin: false, roles: [role1] }
          }
        }).as(editmembershipInteraction);

        cy.getByTestId('row-menu').first().click();
        cy.getByTestId('change-role').click();
        cy.getByTestId('space-role-editor.button').click();
        cy.getAllByTestId('space-role-editor.role-option')
          .first().click();
        cy.getByTestId('confirm-change-role').click();

        cy.wait(`@${editmembershipInteraction}`);
      });

      it('should have changed role', () => {
        cy.getAllByTestId('membership-row').first().as('firstRow');
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
            headers: defaultHeader
          },
          willRespondWith: {
            status: 200,
            body: { ...membership1, sys: { version: 1, ...membership1.sys }, admin: false, roles: [role1] }
          }
        }).as(removeTeamInteraction);

        cy.getByTestId('row-menu').first().click();
        cy.getByTestId('remove-team').click();
        cy.getByTestId('cf-ui-modal-confirm-confirm-button').click();

        cy.wait(`@${removeTeamInteraction}`);
      });

      it.only('should have removed team from space', () => {
        cy.getAllByTestId('membership-row').first().as('firstRow');
        cy.get('@firstRow').contains('td', 'Team 1').should('not.exist');
      });
    });
  });
});
