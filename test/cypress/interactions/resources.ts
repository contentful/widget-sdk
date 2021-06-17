import {
  defaultSpaceId,
  defaultEnvironmentId,
  defaultOrgId,
  defaultHeader,
} from '../util/requests';
import {
  orgResources,
  orgResourcesWithUnlimitedAPIRequest,
} from '../fixtures/responses/organization-resources';
import { envResources } from '../fixtures/responses/environment-resources';

const resourcesWithLimitsReached = require('../fixtures/responses/environment-resources-with-limits-reached.json');
const resources = require('../fixtures/responses/space-resources.json');

enum States {
  SEVERAL_WITH_LIMITS_REACHED = 'resources/several-with-limits-reached',
  SEVRAL_WITH_NO_LIMITS = 'resources/several-with-no-limits',
  SEVERAL = 'resources/several',
  SINGLE = 'resources/single',
}

export const getSpaceResources = {
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

export const getOrgResources = {
  willReturnSeveral() {
    cy.addInteraction({
      provider: 'resources',
      state: States.SEVERAL,
      uponReceiving: `a request to get resources of organization "${defaultOrgId}"`,
      withRequest: {
        method: 'GET',
        path: `/organizations/${defaultOrgId}/resources`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: orgResources,
      },
    }).as('getOrgResources');

    return '@getOrgResources';
  },
  willReturnWithUnlimitedAPIRequest() {
    cy.addInteraction({
      provider: 'resources',
      state: States.SEVRAL_WITH_NO_LIMITS,
      uponReceiving: `a request to get resources of organization "${defaultOrgId}"`,
      withRequest: {
        method: 'GET',
        path: `/organizations/${defaultOrgId}/resources`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: orgResourcesWithUnlimitedAPIRequest,
      },
    }).as('getOrgResources');

    return '@getOrgResources';
  },
};

export const getEnvResources = {
  willReturnSeveral() {
    cy.addInteraction({
      provider: 'resources',
      state: States.SEVERAL,
      uponReceiving: `a request to get environment resources of space "${defaultSpaceId}"`,
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
        body: envResources,
      },
    }).as('getEnvResources');

    return '@getEnvResources';
  },
  willReturnWithLimitsReached() {
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
    }).as('getEnvResourcesWithLimitsReached');

    return '@getEnvResourcesWithLimitsReached';
  },
};
