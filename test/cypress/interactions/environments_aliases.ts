import { defaultSpaceId, defaultHeader } from '../util/requests';

const environmentAliases = require('../fixtures/responses/environment_aliases.json');

export enum States {
  MASTER = 'environments/only-master'
}

export const queryFirst101EnvironmentAliasesInDefaultSpace = {
  willFindOne() {
    cy.addInteraction({
      provider: 'environments',
      state: States.MASTER,
      uponReceiving: `a query for the first 101 environment aliases in the space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environment_aliases`,
        headers: { ...defaultHeader, 'X-Contentful-Enable-Alpha-Feature': 'environment-aliasing' },
        query: {
          limit: '101'
        }
      },
      willRespondWith: {
        status: 200,
        body: environmentAliases
      }
    }).as('queryFirst101EnvironmentAliasesInDefaultSpace');

    return '@queryFirst101EnvironmentAliasesInDefaultSpace';
  },
  willFindNone() {
    environmentAliases.items = [];
    cy.addInteraction({
      provider: 'environments',
      state: States.MASTER,
      uponReceiving: `a query for the first 101 environment aliases in the space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environment_aliases`,
        headers: { ...defaultHeader, 'X-Contentful-Enable-Alpha-Feature': 'environment-aliasing' },
        query: {
          limit: '101'
        }
      },
      willRespondWith: {
        status: 200,
        body: environmentAliases
      }
    }).as('queryFirst101EnvironmentAliasesInDefaultSpace');
    return '@queryFirst101EnvironmentAliasesInDefaultSpace';
  }
};
