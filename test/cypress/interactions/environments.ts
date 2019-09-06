import { defaultSpaceId, defaultHeader, alphaHeader } from '../util/requests';

// TODO: Only one environment in environments.json? Looks weird
const environments = require('../fixtures/responses/environments.json');
const environmentAliases = require('../fixtures/responses/empty.json');

export enum States {
  MASTER = 'environments/only-master'
}

export const queryFirst101EnvironmentsInDefaultSpace = {
  willFindOne() {
    cy.addInteraction({
      provider: 'environments',
      state: States.MASTER,
      uponReceiving: `a query for the first 101 environments in the space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments`,
        headers: defaultHeader,
        query: {
          limit: '101'
        }
      },
      willRespondWith: {
        status: 200,
        body: environments
      }
    }).as('queryFirst101EnvironmentsInDefaultSpace');

    return '@queryFirst101EnvironmentsInDefaultSpace'
  }
}

export const queryFirst101AliasesInDefaultSpace = {
  willReturnNone() {
    cy.addInteraction({
      provider: 'environments',
      state: States.MASTER,
      uponReceiving: `a query for the first 101 aliases in the space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environment_aliases`,
        headers: {...defaultHeader, ...alphaHeader},
        query: {
          limit: '101'
        }
      },
      willRespondWith: {
        status: 200,
        body: environmentAliases
      }
    }).as('queryFirst101AliasesInDefaultSpace');

    return '@queryFirst101AliasesInDefaultSpace'
  }
}
