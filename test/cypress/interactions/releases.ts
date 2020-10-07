import {
  defaultEntryId,
  defaultEnvironmentId,
  defaultHeader,
  defaultReleaseId,
  defaultReleaseActionId,
  defaultSpaceId,
} from '../util/requests';
import { createReleaseRequest } from '../fixtures/requests/releases';

import {
  noReleases,
  severalReleases,
  emptyReleaseResponse,
  severalEntitiesReleaseResponse,
  deleteEntityBodyResponse,
  validateBodyResponse,
  validateErrorResponse,
  publishValidationErrorResponse,
  releaseAction,
} from '../fixtures/responses/releases';

import { deleteEntityBodyRequest } from '../fixtures/requests/releases';

enum States {
  NONE = 'releases/none',
  SEVERAL = 'releases/several',
  SEVERAL_FIRST_ACTIONED = 'releases/several-first-actioned/succeeded',
  DELETE = 'releases/delete',
  DELETE_ENTITY = 'release/entity/delete',
  VALIDATE_RELEASE = 'release/validate',
  VALIDATE_RELEASE_ERROR = 'release/validate/error',
  PUBLISH_RELEASE = 'release/publish',
  PUBLISH_RELEASE_VALIDATION_ERROR = 'release/publish/validate/error',
  RELEASE_ACTION_SUCCEED = 'release/publish/actions/succeded',
  RELEASE_ACTION_FAIL = 'release/publish/actions/fail',
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
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: noReleases(),
      },
    }).as('willReturnNone');

    return '@willReturnNone';
  },

  willReturnSeveral() {
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
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: severalReleases(),
      },
    }).as('willReturnSeveral');

    return '@willReturnSeveral';
  },

  willReturnSeveralFirstActioned() {
    cy.addInteraction({
      provider: 'releases',
      state: States.SEVERAL_FIRST_ACTIONED,
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
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: severalReleases({ defaultActioned: true }),
      },
    }).as('releases/willReturnSeveralFirstActioned');

    return '@releases/willReturnSeveralFirstActioned';
  },
};

export const createEmptyRelease = {
  willReturnEmptyRelease() {
    cy.addInteraction({
      provider: 'releases',
      state: States.NONE,
      uponReceiving: `a request to create release in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'POST',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
        body: createReleaseRequest(),
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: emptyReleaseResponse(),
      },
    }).as('willReturnEmptyRelease');

    return '@willReturnEmptyRelease';
  },
};

export const getReleaseEntities = {
  willReturnNone() {
    cy.addInteraction({
      provider: 'releases',
      state: States.NONE,
      uponReceiving: `a request for no release "${defaultReleaseId}" detail in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases/${defaultReleaseId}`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: emptyReleaseResponse(),
      },
    }).as('willReturnNone');

    return '@willReturnNone';
  },

  willReturnSeveral() {
    cy.addInteraction({
      provider: 'releases',
      state: States.SEVERAL,
      uponReceiving: `a request for several release "${defaultReleaseId}" detail in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases/${defaultReleaseId}`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: severalEntitiesReleaseResponse(),
      },
    }).as('willReturnSeveral');

    return '@willReturnSeveral';
  },
};

export const deleteEntityFromRelease = {
  willSucceed() {
    cy.addInteraction({
      provider: 'releases',
      state: States.DELETE_ENTITY,
      uponReceiving: `a request to delete ${defaultEntryId} from "${defaultReleaseId}"`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases/${defaultReleaseId}`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
        body: deleteEntityBodyRequest(),
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: deleteEntityBodyResponse(),
      },
    }).as('willSucceed');

    return '@willSucceed';
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

export const validateRelease = {
  willSucceed() {
    cy.addInteraction({
      provider: 'releases',
      state: States.VALIDATE_RELEASE,
      uponReceiving: `a request to validate release "${defaultReleaseId}"`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases/${defaultReleaseId}/validated`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: validateBodyResponse(),
      },
    }).as('willSucceed');

    return '@willSucceed';
  },

  willFail() {
    cy.addInteraction({
      provider: 'releases',
      state: States.VALIDATE_RELEASE_ERROR,
      uponReceiving: `a request to validate release "${defaultReleaseId}"`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases/${defaultReleaseId}/validated`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: validateErrorResponse(),
      },
    }).as('willFail');

    return '@willFail';
  },
};

export const publishRelease = {
  willReturnIt() {
    cy.addInteraction({
      provider: 'releases',
      state: States.PUBLISH_RELEASE,
      uponReceiving: `a request to publish release "${defaultReleaseId}"`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases/${defaultReleaseId}/published`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
      },
      willRespondWith: {
        status: 202,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: releaseAction('created'),
      },
    }).as('willSucceed');

    return '@willSucceed';
  },

  willSucceed() {
    cy.addInteraction({
      provider: 'releases',
      state: States.RELEASE_ACTION_SUCCEED,
      uponReceiving: `a request to publish release "${defaultReleaseId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases/${defaultReleaseId}/actions/${defaultReleaseActionId}`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: releaseAction('succeeded'),
      },
    }).as('willSucceed');

    return '@willSucceed';
  },

  willFail() {
    cy.addInteraction({
      provider: 'releases',
      state: States.RELEASE_ACTION_FAIL,
      uponReceiving: `a request to publish release "${defaultReleaseId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases/${defaultReleaseId}/actions/${defaultReleaseActionId}`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: releaseAction('failed'),
      },
    }).as('willSucceed');

    return '@willSucceed';
  },

  willFailWithValidationErrors() {
    cy.addInteraction({
      provider: 'releases',
      state: States.PUBLISH_RELEASE_VALIDATION_ERROR,
      uponReceiving: `a request to validate release "${defaultReleaseId}"`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases/${defaultReleaseId}/published`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
      },
      willRespondWith: {
        status: 422,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: publishValidationErrorResponse(),
      },
    }).as('willFailWithValidationErrors');

    return '@willFailWithValidationErrors';
  },
};
