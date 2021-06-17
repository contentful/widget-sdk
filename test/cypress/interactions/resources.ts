import { defaultSpaceId, defaultEnvironmentId } from '../util/requests';

const resourcesWithLimitsReached = require('../fixtures/responses/resources-with-limits-reached.json');
const resources = require('../fixtures/responses/resources.json');
const resourceContentType = require('../fixtures/responses/resource-content-type.json');

enum States {
  SEVERAL_WITH_LIMITS_REACHED = 'resources/several-with-limits-reached',
  SEVERAL = 'resources/several',
  SINGLE = 'resources/single',
}

export const getResources = {
  willReturnSeveral() {
    cy.addInteraction({
      provider: 'resources',
      state: States.SEVERAL,
      uponReceiving: `a request to get resources of space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/resources`,
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: resources,
      },
    }).as('getResources');

    return '@getResources';
  },
};

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
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
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
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: resources,
      },
    }).as('getResourcesWithEnvironment');

    return '@getResourcesWithEnvironment';
  },
};

export const getLocaleResource = {
  willReturnDefault() {
    cy.addInteraction({
      provider: 'resources',
      state: States.SINGLE,
      uponReceiving: `a request to get locale resource of space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/resources/locale`,
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
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
    }).as('getLocaleResource');

    return '@getLocaleResource';
  },
};

export const getContentTypeResource = {
  willReturnDefault() {
    cy.addInteraction({
      provider: 'resources',
      state: States.SINGLE,
      uponReceiving: `a request to get content types resource of space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/resources/content_type`,
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: resourceContentType,
      },
    }).as('getContentTypeResource');

    return '@getContentTypeResource';
  },
};
