import {
  defaultHeader,
  defaultSpaceId,
  defaultEnvironmentId,
  defaultReleaseId,
} from '../util/requests';

import { noReleases, severalReleases } from '../fixtures/responses/releases';

enum States {
  NONE = 'releases/none',
  SEVERAL = 'releases/several',
  DELETE = 'releases/delete',
}

export const getReleasesList = {
  willReturnNone() {
    cy.addInteraction({
      provider: 'releases',
      state: States.NONE,
      uponReceiving: `a request for no releases in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
      },
      willRespondWith: {
        status: 200,
        body: noReleases(),
      },
    }).as('willReturnNone');

    return '@willReturnNone';
  },

  willReturnSeveral() {
    console.log('severalReleases(): ', severalReleases());
    cy.addInteraction({
      provider: 'releases',
      state: States.SEVERAL,
      uponReceiving: `a request for several releases in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
      },
      willRespondWith: {
        status: 200,
        body: severalReleases(),
      },
    }).as('willReturnSeveral');

    return '@willReturnSeveral';
  },
};

export const deleteRelease = {
  willSucceed() {
    cy.addInteraction({
      provider: 'releases',
      state: States.DELETE,
      uponReceiving: `a request to delete release ${defaultReleaseId} in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'DELETE',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases/${defaultReleaseId}`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
      },
      willRespondWith: {
        status: 204,
      },
    }).as('willSucceed');

    return '@willSucceed';
  },
};