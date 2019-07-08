import { defaultRequestsMock } from '../../../util/factories';
import * as state from '../../../util/interactionState';
import { defaultHeader, defaultSpaceId, defaultOrgId } from '../../../util/requests';
import { orgProductCatalogFeaturesResponse } from '../../../interactions/product_catalog_features';

const empty = require('../../../fixtures/responses/empty.json');

const loadPageWithServerState = (stateName, responseBody, message) => {
  cy.resetAllFakeServers();

  defaultRequestsMock({});

  cy.setAuthTokenToLocalStorage();

  orgProductCatalogFeaturesResponse();

  const getMembershipsInteraction = 'spaces/team_space_memberships';
  const getTeamsInteraction = 'org/teams';

  cy.addInteraction({
    provider: 'teams',
    state: stateName,
    uponReceiving: message,
    withRequest: {
      method: 'GET',
      path: `/spaces/${defaultSpaceId}/team_space_memberships`,
      query: { include: 'roles,sys.team', limit: '100', skip: '0' },
      headers: defaultHeader
    },
    willRespondWith: {
      status: 200,
      body: responseBody
    }
  }).as(getMembershipsInteraction);

  cy.addInteraction({
    provider: 'teams',
    state: 'no-teams',
    uponReceiving: 'request for teams in org',
    withRequest: {
      method: 'GET',
      path: `/organizations/${defaultOrgId}/teams`,
      query: { limit: '100', skip: '0' },
      headers: defaultHeader
    },
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as(getTeamsInteraction);

  cy.visit(`/spaces/${defaultSpaceId}/settings/teams`);

  cy.wait([`@${state.Token.VALID}`, `@${getMembershipsInteraction}`, `@${getTeamsInteraction}`]);
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
      providers: ['teams', 'roles'],
      cors: true,
      pactfileWriteMode: 'merge',
      spec: 2
    });
  });

  context('opening the page with no teams in the space', () => {
    beforeEach(() => {
      loadPageWithServerState('empty', empty, 'request for empty member list');
    });

    it('renders the table without rows', () => {
      cy.getByTestId('membership-table').should('be.visible');
      cy.queryByTestId('membership-row').should('not.exist');
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
  });
});
