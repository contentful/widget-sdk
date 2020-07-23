import { RequestOptions } from '@pact-foundation/pact-web';
import { defaultHeader, defaultSpaceId, defaultOrgId } from '../util/requests';

const mediumSpacePlan = require('../fixtures/responses/space-plan-medium.json');
const empty = require('../fixtures/responses/empty.json');

const getBasePlanInteraction = 'query_base_plan';
const getPlansInteraction = 'get_plans';
const getProductRatePlansInteraction = 'get_product_rate_plans';
const getProductRatePlansWithSpaceInteraction = 'get_product_rate_plans_with_space';

function queryPlans(): RequestOptions {
  return {
    method: 'GET',
    path: `/organizations/${defaultOrgId}/plans`,
    headers: {
      ...defaultHeader,
      'x-contentful-enable-alpha-feature': 'subscriptions-api',
    },
    query: {
      gatekeeper_key: defaultSpaceId,
      plan_type: 'space',
    },
  };
}

export const getSpacePlan = {
  willReturnDefault() {
    cy.addInteraction({
      provider: 'plans',
      state: 'plans get space plan',
      uponReceiving: `a request to get the space plan `,
      withRequest: queryPlans(),
      willRespondWith: {
        status: 200,
        body: mediumSpacePlan,
      },
    }).as('getSpacePlan');

    return '@getSpacePlan';
  },
};

const freePlanResponse = {
  total: 1,
  sys: {
    type: 'Array',
  },
  items: [
    {
      sys: {
        type: 'Plan',
        id: 'free',
      },
      name: 'Community Platform',
      price: 0.0,
      productRatePlanId: '2c92c0f971c65dfe0171e4297abc0d76',
      productName: 'Community: Default (May 2020)',
      planType: 'base',
      gatekeeperKey: null,
      committed: false,
      customerType: 'Free',
      ratePlanCharges: [],
    },
  ],
};

const enterprisePlanResponse = {
  total: 1,
  sys: {
    type: 'Array',
  },
  items: [
    {
      sys: {
        type: 'Plan',
        id: '2c92c0fa7304c85b0173100413a40ad8',
      },
      name: 'Medium',
      price: 5868.0,
      productRatePlanId: '2c92c0f8725aed5b01725b642ee83ac0',
      productName: 'Enterprise: Default (May 2020) Annual',
      planType: 'base',
      gatekeeperKey: 'wmww4trw3d6y',
      committed: false,
      customerType: 'Enterprise',
      ratePlanCharges: [],
    },
  ],
};

export const getBasePlan = {
  willReturnFree() {
    cy.addInteraction({
      provider: 'plans',
      state: 'free base plan',
      uponReceiving: `a request to get the free tier base plan`,
      withRequest: {
        method: 'GET',
        path: `/organizations/${defaultOrgId}/plans`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'subscriptions-api',
        },
        query: {
          plan_type: 'base',
        },
      },
      willRespondWith: {
        status: 200,
        body: freePlanResponse,
      },
    }).as(getBasePlanInteraction);

    return `@${getBasePlanInteraction}`;
  },
  willReturnEnterprise() {
    cy.addInteraction({
      provider: 'plans',
      state: 'enterprise base plan',
      uponReceiving: `a request to get the enterprise tier base plan`,
      withRequest: {
        method: 'GET',
        path: `/organizations/${defaultOrgId}/plans`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'subscriptions-api',
        },
        query: {
          plan_type: 'base',
        },
      },
      willRespondWith: {
        status: 200,
        body: enterprisePlanResponse,
      },
    }).as(getBasePlanInteraction);

    return `@${getBasePlanInteraction}`;
  },
};

export const getPlans = {
  willContainFree() {
    cy.addInteraction({
      provider: 'plans',
      state: 'plans containing a free plan',
      uponReceiving: `a request to get the plans`,
      withRequest: {
        method: 'GET',
        path: `/organizations/${defaultOrgId}/plans`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'subscriptions-api',
        },
        query: '',
      },
      willRespondWith: {
        status: 200,
        body: freePlanResponse,
      },
    }).as(getPlansInteraction);

    return `@${getPlansInteraction}`;
  },
  willContainEnterprise() {
    cy.addInteraction({
      provider: 'plans',
      state: 'plans containing an enterprise plan',
      uponReceiving: `a request to get the plans`,
      withRequest: {
        method: 'GET',
        path: `/organizations/${defaultOrgId}/plans`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'subscriptions-api',
        },
        query: '',
      },
      willRespondWith: {
        status: 200,
        body: enterprisePlanResponse,
      },
    }).as(getPlansInteraction);

    return `@${getPlansInteraction}`;
  },
};

export const getProductRatePlans = {
  willReturnEmpty() {
    cy.addInteraction({
      provider: 'plans',
      state: 'empty',
      uponReceiving: 'a request to get empty product rate plans',
      withRequest: {
        method: 'GET',
        path: `/organizations/${defaultOrgId}/product_rate_plans`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        body: empty,
      },
    }).as(getProductRatePlansInteraction);

    return `@${getProductRatePlansInteraction}`;
  },
  willReturnDefault() {
    cy.addInteraction({
      provider: 'plans',
      state: 'default rate plans',
      uponReceiving: 'a request to get the product rate plans',
      withRequest: {
        method: 'GET',
        path: `/organizations/${defaultOrgId}/product_rate_plans`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        body: {
          total: 3,
          sys: {
            type: 'Array',
          },
          items: [
            {
              sys: {
                type: 'ProductRatePlan',
                id: 'free',
              },
              name: 'Community',
              price: 0.0,
              internalName: 'free_space',
              productPlanType: 'free_space',
              productType: 'on_demand',
              productRatePlanCharges: [],
              roleSet: {
                id: 'basic_v2',
                roles: ['Editor'],
              },
              committed: false,
              customerType: 'Self-service',
              unavailabilityReasons: [
                {
                  type: 'freeSpacesMaximumLimitReached',
                  maximumLimit: 1,
                  usage: 1,
                  additionalInfo: 'Free spaces',
                },
              ],
            },
          ],
        },
      },
    }).as(getProductRatePlansInteraction);

    return `@${getProductRatePlansInteraction}`;
  },
};

export const getProductRatePlansWithSpace = {
  willReturnDefault() {
    cy.addInteraction({
      provider: 'plans',
      state: 'default rate plans',
      uponReceiving: 'a request to get the product rate plans with a space key',
      withRequest: {
        method: 'GET',
        path: `/organizations/${defaultOrgId}/product_rate_plans`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'subscriptions-api',
        },
        query: {
          plan_type: 'space',
          space_id: defaultSpaceId,
        },
      },
      willRespondWith: {
        status: 200,
        body: {
          total: 3,
          sys: {
            type: 'Array',
          },
          items: [
            {
              sys: {
                type: 'ProductRatePlan',
                id: 'free',
              },
              name: 'Community',
              price: 0.0,
              internalName: 'free_space',
              productPlanType: 'free_space',
              productType: 'on_demand',
              productRatePlanCharges: [],
              roleSet: {
                id: 'basic_v2',
                roles: ['Editor'],
              },
              committed: false,
              customerType: 'Self-service',
              unavailabilityReasons: [
                {
                  type: 'freeSpacesMaximumLimitReached',
                  maximumLimit: 1,
                  usage: 1,
                  additionalInfo: 'Free spaces',
                },
              ],
            },
            {
              sys: {
                type: 'ProductRatePlan',
                id: 'free',
              },
              name: 'Medium',
              price: 489.0,
              internalName: 'space_size_1',
              productPlanType: 'on_demand',
              productType: 'on_demand',
              productRatePlanCharges: [],
              roleSet: {
                id: 'basic_v2',
                roles: ['Editor'],
              },
              committed: false,
              customerType: 'Self-service',
              unavailabilityReasons: [],
            },
          ],
        },
      },
    }).as(getProductRatePlansWithSpaceInteraction);

    return `@${getProductRatePlansWithSpaceInteraction}`;
  },
};
