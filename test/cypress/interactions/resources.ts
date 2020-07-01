import { defaultSpaceId, defaultEnvironmentId } from '../util/requests';

const resourcesWithLimitsReached = require('../fixtures/responses/resources-with-limits-reached.json');
const resources = require('../fixtures/responses/resources.json');

enum States {
  SEVERAL_WITH_LIMITS_REACHED = 'resources/several-with-limits-reached',
  SEVERAL = 'resources/several',
}

export const getResourcesWithLimitsReached = {
  willReturnSeveral() {
    cy.addInteraction({
      provider: 'resources',
      state: States.SEVERAL_WITH_LIMITS_REACHED,
      uponReceiving: `a request to get resources with limits reached environment "${defaultEnvironmentId}" of space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/resources`,
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
      },
      willRespondWith: {
        status: 200,
        body: resourcesWithLimitsReached,
      },
    }).as('getResourcesWithLimitsReached');

    return '@getResourcesWithLimitsReached';
  },
};

export const getResourcesWithEnvironment = {
  willReturnSeveral() {
    cy.addInteraction({
      provider: 'resources',
      state: States.SEVERAL,
      uponReceiving: `a request to get resources with environments of space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/resources/environment`,
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
      },
      willRespondWith: {
        status: 200,
        body: resources,
      },
    }).as('getResourcesWithEnvironment');

    return '@getResourcesWithEnvironment';
  },
};

export const getResourcesWithLocale = {
  willReturnSeveral() {
    cy.addInteraction({
      provider: 'resources',
      state: States.SEVERAL,
      uponReceiving: `a request to get resources with locales of space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/resources/locale`,
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
      },
      willRespondWith: {
        status: 200,
        body: resources,
      },
    }).as('getResourcesWithLocale');

    return '@getResourcesWithLocale';
  },
};

export const getResourcesForEnvironmentWithLocale = {
  willReturnSeveral() {
    cy.addInteraction({
      provider: 'resources',
      state: States.SEVERAL,
      uponReceiving: `a request to get resources for environment with locales of space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/resources/locale`,
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
      },
      willRespondWith: {
        status: 200,
        body: {
          name: 'Locale',
          usage: 1,
          limits: { included: 30, maximum: 30 },
          parent: null,
          kind: 'permanent',
          period: null,
          sys: { type: 'EnvironmentResource', id: 'locale' },
          unitOfMeasure: null,
        },
      },
    }).as('getResourcesForEnvironmentWithLocale');

    return '@getResourcesForEnvironmentWithLocale';
  },
};
