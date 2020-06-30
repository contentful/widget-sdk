import { defaultHeader, defaultSpaceId } from '../util/requests';

const environmentsResponse = (environments: object[]): Object => ({
  total: environments.length,
  limit: 100,
  skip: 0,
  sys: {
    type: 'Array',
  },
  items: environments,
});

const environment = (name: string): Object => {
  return {
    name: name,
    sys: {
      type: 'Environment',
      id: name,
      version: 1,
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: '1ustzobjs3hp',
        },
      },
      status: {
        sys: {
          type: 'Link',
          linkType: 'Status',
          id: 'ready',
        },
      },
      createdBy: {
        sys: {
          type: 'Link',
          linkType: 'User',
          id: '0mHgmvLLYcbQqehqEm7i0w',
        },
      },
      createdAt: '2018-08-16T07:14:10Z',
      updatedBy: {
        sys: {
          type: 'Link',
          linkType: 'User',
          id: '0mHgmvLLYcbQqehqEm7i0w',
        },
      },
      updatedAt: '2018-08-16T07:14:10Z',
    },
  };
};

export enum States {
  MASTER = 'environments/only-master',
  NEW = 'environments/new',
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
          limit: '101',
        },
      },
      willRespondWith: {
        status: 200,
        body: environmentsResponse([environment('master')]),
        //        body: environments
      },
    }).as('queryFirst101EnvironmentsInDefaultSpace');

    return '@queryFirst101EnvironmentsInDefaultSpace';
  },
  willFindTwo() {
    cy.addInteraction({
      provider: 'environments',
      state: States.NEW,
      uponReceiving: `a query for the first 101 environments in the space "${defaultSpaceId} and 2 environments"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments`,
        headers: defaultHeader,
        query: {
          limit: '101',
        },
      },
      willRespondWith: {
        status: 200,
        body: environmentsResponse([environment('master'), environment('123')]),
      },
    }).as('queryFirst101EnvironmentsInDefaultSpaceWithNewEnv');

    return '@queryFirst101EnvironmentsInDefaultSpaceWithNewEnv';
  },
};

export const putEnvironmentInDefaultSpace = {
  willCreate(name: string) {
    cy.addInteraction({
      provider: 'environments',
      state: States.NEW,
      uponReceiving: `a query for creating environment "123" in the space "${defaultSpaceId}"`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/environments/${name}`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        body: environment(name),
      },
    }).as('createEnvironmentsInDefaultSpace');

    return '@createEnvironmentsInDefaultSpace';
  },
};

export const deleteEnvironmentInDefaultSpace = {
  willDelete(name: string) {
    cy.addInteraction({
      provider: 'environments',
      state: States.NEW,
      uponReceiving: `a query for deleting environment "123" in the space "${defaultSpaceId}"`,
      withRequest: {
        method: 'DELETE',
        path: `/spaces/${defaultSpaceId}/environments/${name}`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        body: '',
      },
    }).as('deleteEnvironmentInDefaultSpace');

    return '@deleteEnvironmentInDefaultSpace';
  },
};
